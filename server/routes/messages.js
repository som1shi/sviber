const express = require('express');
const router = express.Router();
const { Message } = require('../models/Message');
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');

// GET /api/messages/:matchId — load chat history for a match
router.get('/:matchId', ensureAuthenticated, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id,
    }).select('_id').lean();

    if (!match) return res.status(404).json({ error: 'Match not found' });

    const messages = await Message.find({ matchId: req.params.matchId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
