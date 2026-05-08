const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Survey = require('../models/Survey');
const User = require('../models/User');
const { Message } = require('../models/Message');
const { ensureAuthenticated } = require('../middleware/auth');
const { onMatchCollab, onMatchPassed } = require('../lib/elo');
const { structuredScore } = require('../lib/matching');

const POPULATE_USERS = 'name email profilePic title school bio githubLink elo skills primaryRole';

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', POPULATE_USERS)
      .sort({ createdAt: -1 });

    // Deduplicate: one match per partner
    const myId = String(req.user._id);
    const seen = new Map();
    for (const m of matches) {
      const partner = m.users.find((u) => String(u._id) !== myId);
      if (!partner) continue;
      const partnerId = String(partner._id);
      if (!seen.has(partnerId)) seen.set(partnerId, m);
    }

    const deduped = [...seen.values()];

    // Recalculate scores from current survey data so they stay fresh
    const [mySurvey, myUserFresh] = await Promise.all([
      Survey.findOne({ userId: req.user._id }).lean(),
      User.findById(req.user._id).lean(),
    ]);

    const scored = await Promise.all(
      deduped.map(async (m) => {
        const partner = m.users.find((u) => String(u._id) !== myId);
        const plain = m.toObject ? m.toObject() : { ...m };
        if (!partner) return plain;

        const [partnerSurvey, partnerUserFresh] = await Promise.all([
          Survey.findOne({ userId: partner._id }).lean(),
          User.findById(partner._id).lean(),
        ]);

        const freshScore = structuredScore(
          mySurvey,
          partnerSurvey,
          myUserFresh || req.user,
          partnerUserFresh || partner,
        );

        plain.score = freshScore;

        // Persist in background — don't block response
        Match.findByIdAndUpdate(m._id, { score: freshScore, scorePending: false }).catch(() => {});

        return plain;
      })
    );

    scored.sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));

    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', POPULATE_USERS);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['collab', 'passed'].includes(status)) {
      return res.status(400).json({ error: 'status must be collab or passed' });
    }

    const match = await Match.findOne({ _id: req.params.id, users: req.user._id });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    match.status = status;
    if (status === 'collab' && !match.collabStartedAt) {
      match.collabStartedAt = new Date();
    }
    await match.save();

    if (status === 'collab') {
      onMatchCollab(match.users.map(String)).catch(() => {});
    } else if (status === 'passed') {
      onMatchPassed(String(req.user._id)).catch(() => {});
    }

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, users: req.user._id });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    await Message.deleteMany({ matchId: match._id });
    await match.deleteOne();
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
