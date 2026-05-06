const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const { computeMatchScore, matchPairKey } = require('../services/matchScoring');

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, direction } = req.body;
    if (!ideaId || !['right', 'left', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'ideaId and direction (right|left|up) required' });
    }

    const now = new Date();
    const prev = await Swipe.findOne({ user: req.user._id, idea: ideaId });
    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(req.user._id, {
      lastActiveAt: now,
      lastSwipeAt: now,
    });

    if (direction === 'right' && (!prev || prev.direction !== 'right')) {
      await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: 1 } });
    }
    if (direction !== 'right' && prev && prev.direction === 'right') {
      await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: -1 } });
    }

    const matchesCreated = [];

    if (direction === 'right') {
      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      const otherSwipes = await Swipe.find({
        idea: ideaId,
        direction: 'right',
        user: { $ne: req.user._id },
      });

      const currentUser = await User.findById(req.user._id);
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      for (const other of otherSwipes) {
        const pk = matchPairKey(ideaId, req.user._id, other.user);
        const exists = await Match.findOne({ pairKey: pk });
        if (exists) continue;

        const otherUser = await User.findById(other.user);
        if (!otherUser) continue;

        const score = computeMatchScore(currentUser, otherUser, {
          sameIdea: true,
          now,
        });

        const orderedUsers = [req.user._id, other.user].sort((a, b) =>
          String(a).localeCompare(String(b))
        );

        try {
          const match = await Match.create({
            idea: ideaId,
            pairKey: pk,
            users: orderedUsers,
            score,
          });
          matchesCreated.push(match);
        } catch (createErr) {
          if (createErr.code === 11000) continue; // race: duplicate pairKey
          throw createErr;
        }
      }
    }

    res.json({ swipe, matches: matchesCreated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
