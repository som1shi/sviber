const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

function computeMatchScore(userA, userB) {
  const eloA = typeof userA.elo === 'number' ? userA.elo : userA.elo?.total || 0;
  const eloB = typeof userB.elo === 'number' ? userB.elo : userB.elo?.total || 0;
  const skillsA = Array.isArray(userA.skills) ? userA.skills : [];
  const skillsB = Array.isArray(userB.skills) ? userB.skills : [];
  const eloCompatibility = Math.max(0, 100 - Math.abs(eloA - eloB) / 10);
  const skillsFit = (() => {
    const a = new Set(skillsA);
    const b = new Set(skillsB);
    const shared = [...a].filter((s) => b.has(s)).length;
    const total = new Set([...a, ...b]).size;
    return total === 0 ? 50 : Math.round((1 - shared / total) * 100);
  })();
  const activity = Math.min(100, (eloA + eloB) / 2);
  const total = Math.round((100 + eloCompatibility + skillsFit + activity) / 4);
  return { ideaAlignment: 100, eloCompatibility: Math.round(eloCompatibility), skillsFit, activity: Math.round(activity), total };
}

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, direction } = req.body;
    if (!ideaId || !['right', 'left', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'ideaId and direction (right|left|up) required' });
    }

    const previousSwipe = await Swipe.findOne({ user: req.user._id, idea: ideaId });
    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    let match = null;

    if (direction === 'right') {
      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      if (previousSwipe?.direction !== 'right') {
        await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: 1 } });
      }

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

        match = await match.populate([
          { path: 'idea', select: 'title description tags' },
          { path: 'users', select: 'displayName avatar role elo skills' },
        ]);
      }
    }

    res.json({ swipe, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
