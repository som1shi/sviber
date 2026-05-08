const express = require('express');
const router = express.Router();
const { Message } = require('../models/Message');
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');

// GET /api/messages/:matchId — load chat history
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

// POST /api/messages/:matchId — send and persist a message, then broadcast via socket
router.post('/:matchId', ensureAuthenticated, async (req, res) => {
  try {
    const { content, senderInitials, senderColor } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'content required' });

    const match = await Match.findOne({
      _id: req.params.matchId,
      users: req.user._id,
    }).select('_id').lean();

    if (!match) return res.status(404).json({ error: 'Match not found' });

    const message = await Message.create({
      matchId: req.params.matchId,
      senderId: String(req.user._id),
      senderInitials: senderInitials || '?',
      senderColor: senderColor || '#7C5CFC',
      content: content.trim(),
    });

    await Match.findByIdAndUpdate(req.params.matchId, { lastMessageAt: message.createdAt }).catch(() => {});

    // Broadcast to everyone else in the socket room (sender already has optimistic UI)
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.matchId).emit('chat-message', {
        id: String(message._id),
        senderId: String(req.user._id),
        senderInitials: message.senderInitials,
        senderColor: message.senderColor,
        content: message.content,
        time: message.createdAt,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
