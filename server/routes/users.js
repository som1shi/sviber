const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-elo.history');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = ['name', 'profilePic', 'title', 'school', 'bio', 'githubLink', 'skills'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
