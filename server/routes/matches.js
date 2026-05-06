const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');
const { onMatchCollab, onMatchPassed } = require('../lib/elo');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const matches = await Match.find({ users: req.user._id })
      .populate('idea', 'title description tags')
      .populate('users', 'displayName avatar elo.total elo.breakdown')
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

    const match = await Match.findOneAndUpdate(
      { _id: req.params.id, users: req.user._id },
      { status },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: 'Match not found' });

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
