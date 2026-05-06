const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const Survey = require('../models/Survey');
const { ensureAuthenticated } = require('../middleware/auth');
const { recalcElo } = require('../lib/elo');
const { structuredScore, computeAndStoreCulturefit } = require('../lib/matching');

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
      .populate('founder', 'displayName avatar elo.total');

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

    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    if (idea.founder.toString() === req.user._id.toString()) {
      return res.status(403).json({ error: 'Cannot swipe on your own idea' });
    }

    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    // Track swipe stats for elo (fire-and-forget)
    const statInc = { 'elo.stats.totalSwipes': 1 };
    if (direction === 'right') statInc['elo.stats.rightSwipes'] = 1;
    User.findByIdAndUpdate(req.user._id, { $inc: statInc })
      .then(() => recalcElo(req.user._id))
      .catch(() => {});

    let match = null;

    if (direction === 'right') {
      await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: 1 } });

      const otherSwipes = await Swipe.find({
        idea: ideaId,
        direction: 'right',
        user: { $ne: req.user._id },
      });

      if (otherSwipes.length > 0) {
        const [currentUser, currentSurvey] = await Promise.all([
          User.findById(req.user._id),
          Survey.findOne({ userId: req.user._id }).lean(),
        ]);

        for (const other of otherSwipes) {
          const exists = await Match.findOne({ idea: ideaId, users: { $all: [req.user._id, other.user] } });
          if (exists) continue;

          const [otherUser, otherSurvey] = await Promise.all([
            User.findById(other.user),
            Survey.findOne({ userId: other.user }).lean(),
          ]);

          const score = structuredScore(currentSurvey, otherSurvey, currentUser, otherUser);

          match = await Match.create({
            idea: ideaId,
            users: [req.user._id, other.user],
            score,
            scorePending: true,
          });

          // Async: ask Claude to score culture fit from text answers, update match when done
          computeAndStoreCulturefit(match._id, req.user._id, other.user).catch(() => {});
        }
      }
    }

    res.json({ swipe, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
