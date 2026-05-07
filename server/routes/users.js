const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users/me — get logged in user's profile
router.get('/me', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const user = await User.findById(req.user._id).lean();
  if (user && typeof user.elo !== 'number') user.elo = 0;
  res.json(user);
});

// PUT /api/users/me — update logged in user's profile
router.put('/me', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const { displayName, role, school, bio, github } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { displayName, role, school, bio, github },
    { new: true }
  );
  res.json(updated);
});

module.exports = router;
