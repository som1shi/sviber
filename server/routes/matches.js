const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');
const { onMatchCollab, onMatchPassed } = require('../lib/elo');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', 'name profilePic title school bio githubLink elo skills primaryRole')
      .sort({ 'score.total': -1, createdAt: -1 });

    // Deduplicate: one match per partner (keep highest score)
    const myId = String(req.user._id);
    const seen = new Map();
    for (const m of matches) {
      const partner = m.users.find((u) => String(u._id) !== myId);
      if (!partner) continue;
      const partnerId = String(partner._id);
      if (!seen.has(partnerId)) seen.set(partnerId, m);
    }

    res.json([...seen.values()]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', 'name profilePic title school bio githubLink elo skills primaryRole');
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

module.exports = router;
