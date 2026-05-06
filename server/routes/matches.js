const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', 'name profilePic elo.total skills primaryRole')
      .sort({ createdAt: -1 });
    res.json(matches);
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
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
