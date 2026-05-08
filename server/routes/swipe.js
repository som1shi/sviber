const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const Survey = require('../models/Survey');
const { ensureAuthenticated } = require('../middleware/auth');
const { onSwipe } = require('../lib/elo');
const { structuredScore } = require('../lib/matching');
const { matchPairKey } = require('../services/matchScoring');

router.get('/feed', ensureAuthenticated, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const swiped = await Swipe.find({ user: req.user._id }).distinct('idea');

    const ideas = await Idea.find({
      _id: { $nin: swiped },
      founder: { $ne: req.user._id },
      status: 'open',
    })
      .sort({ eloScore: -1 })
      .limit(Number(limit))
      .populate('founder', 'name profilePic elo.total');

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, direction } = req.body;
    if (!ideaId || !['right', 'left', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'ideaId and direction (right|left|up) required' });
    }

    const idea = await Idea.findById(ideaId).select('founder').lean();
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (String(idea.founder) === String(req.user._id)) {
      return res.status(403).json({ error: 'Cannot swipe on your own idea' });
    }

    const now = new Date();
    const prev = await Swipe.findOne({ user: req.user._id, idea: ideaId });

    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    onSwipe(req.user._id, direction === 'right').catch((err) => console.error('[elo] onSwipe error:', err.message));

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
      // One match per idea per user — skip if already matched on this idea
      const alreadyMatchedOnIdea = await Match.findOne({ idea: ideaId, users: req.user._id });
      if (!alreadyMatchedOnIdea) {
        const otherSwipes = await Swipe.find({
          idea: ideaId,
          direction: 'right',
          user: { $ne: req.user._id },
        });

        const [currentUser, currentSurvey] = await Promise.all([
          User.findById(req.user._id),
          Survey.findOne({ userId: req.user._id }).lean(),
        ]);

        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        // Score every candidate and pick the best available one
        let bestScore = null;
        let bestOther = null;
        let bestOtherUser = null;

        for (const other of otherSwipes) {
          // Skip if this exact pair already has a match for this idea
          const pk = matchPairKey(ideaId, req.user._id, other.user);
          const exists = await Match.findOne({ pairKey: pk });
          if (exists) continue;

          // Skip if the other person is already matched on this idea with someone else
          const otherMatchedOnIdea = await Match.findOne({ idea: ideaId, users: other.user });
          if (otherMatchedOnIdea) continue;

          const [otherUser, otherSurvey] = await Promise.all([
            User.findById(other.user),
            Survey.findOne({ userId: other.user }).lean(),
          ]);
          if (!otherUser) continue;

          const score = structuredScore(currentSurvey, otherSurvey, currentUser, otherUser);
          if (!bestScore || score.total > bestScore.total) {
            bestScore = score;
            bestOther = other;
            bestOtherUser = otherUser;
          }
        }

        // Create exactly one match — with the highest-scoring candidate
        if (bestOther && bestScore) {
          const pk = matchPairKey(ideaId, req.user._id, bestOther.user);
          const orderedUsers = [req.user._id, bestOther.user].sort((a, b) =>
            String(a).localeCompare(String(b))
          );
          try {
            const createdMatch = await Match.create({
              idea: ideaId,
              pairKey: pk,
              users: orderedUsers,
              score: bestScore,
              scorePending: false,
            });
            const populatedMatch = await Match.findById(createdMatch._id)
              .populate('idea', 'title description tags')
              .populate('users', 'name profilePic title school bio githubLink elo skills primaryRole')
              .lean();
            matchesCreated.push(populatedMatch || createdMatch);
          } catch (createErr) {
            if (createErr.code !== 11000) throw createErr;
          }
        }
      }
    }

    res.json({ swipe, matches: matchesCreated, match: matchesCreated[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
