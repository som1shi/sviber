const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

function computeMatchScore(userA, userB) {
  const eloCompatibility = Math.max(0, 100 - Math.abs(userA.elo.total - userB.elo.total) / 10);
  const skillsFit = (() => {
    const a = new Set(userA.skills);
    const b = new Set(userB.skills);
    const shared = [...a].filter((s) => b.has(s)).length;
    const total = new Set([...a, ...b]).size;
    return total === 0 ? 50 : Math.round((1 - shared / total) * 100);
  })();
  const activity = Math.min(100, (userA.elo.total + userB.elo.total) / 2);
  const total = Math.round((100 + eloCompatibility + skillsFit + activity) / 4);
  return { ideaAlignment: 100, eloCompatibility: Math.round(eloCompatibility), skillsFit, activity: Math.round(activity), total };
}

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, direction } = req.body;
    if (!ideaId || !['right', 'left', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'ideaId and direction (right|left|up) required' });
    }

    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    let match = null;

    if (direction === 'right') {
      await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: 1 } });

      const otherSwipes = await Swipe.find({
        idea: ideaId,
        direction: 'right',
        user: { $ne: req.user._id },
      });

      const currentUser = await User.findById(req.user._id);

      for (const other of otherSwipes) {
        const exists = await Match.findOne({ idea: ideaId, users: { $all: [req.user._id, other.user] } });
        if (exists) continue;

        const otherUser = await User.findById(other.user);
        const score = computeMatchScore(currentUser, otherUser);

        match = await Match.create({
          idea: ideaId,
          users: [req.user._id, other.user],
          score,
        });
      }
    }

    res.json({ swipe, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
