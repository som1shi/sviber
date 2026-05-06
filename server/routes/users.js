const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

/** Shape returned to the client (Settings / Profile use displayName, avatar, role, github). */
function meShape(u) {
  if (!u) return u;
  const o = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  const eloTotal =
    o.elo && typeof o.elo === 'object' && 'total' in o.elo ? o.elo.total : Number(o.elo) || 0;
  return {
    ...o,
    displayName: o.name,
    avatar: o.profilePic,
    github: o.githubLink || '',
    role: o.title || '',
    elo: eloTotal,
    eloDetail: o.elo,
  };
}

// GET /api/users/me — logged-in user (Settings / Profile)
router.get('/me', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(meShape(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me — update logged-in user
router.put('/me', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
    const { displayName, role, school, bio, github, skills, primaryRole } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.name = displayName;
    if (role !== undefined) updates.title = role;
    if (school !== undefined) updates.school = school;
    if (bio !== undefined) updates.bio = bio;
    if (github !== undefined) updates.githubLink = github;
    if (skills !== undefined) updates.skills = skills;
    if (primaryRole !== undefined) updates.primaryRole = primaryRole;

    const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).lean();
    res.json(meShape(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'me') return res.status(404).json({ error: 'Not found' });
    const user = await User.findById(req.params.id).select('-elo.history').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(meShape(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — update by id (must be self)
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    if (req.params.id === 'me') {
      return res.status(400).json({ error: 'Use PUT /api/users/me' });
    }
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = [
      'name',
      'profilePic',
      'title',
      'school',
      'bio',
      'githubLink',
      'skills',
      'primaryRole',
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    res.json(meShape(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
