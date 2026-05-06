const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { recalcElo, ensureEloSchema, onSwipe } = require('../lib/elo');

const SIGNALS = [
  { pattern: /launched|shipped|live users|active users|production/i,       points: 50, reason: 'Launched a product with real users' },
  { pattern: /co-?founder|founded|started a (company|startup)/i,           points: 40, reason: 'Founded or co-founded a startup' },
  { pattern: /y combinator|yc (s|w)\d{2}|techstars|a16z|sequoia/i,        points: 60, reason: 'Top accelerator / investor' },
  { pattern: /(\d[\d,]+)\s*stars|popular open.?source/i,                   points: 30, reason: 'Significant open source project' },
  { pattern: /internship|intern at|software engineer intern/i,              points: 20, reason: 'Relevant internship experience' },
  { pattern: /hackathon.*win|won.*hackathon|1st place.*hack|hack.*1st/i,   points: 15, reason: 'Hackathon win' },
  { pattern: /github\.com\/\w+|open.?source contributor|\d+ contributions/i, points: 10, reason: 'Active GitHub presence' },
];

function scoreResume(text) {
  const reasons = [];
  let total = 0;
  for (const signal of SIGNALS) {
    if (signal.pattern.test(text)) {
      total += signal.points;
      reasons.push(signal.reason);
    }
  }
  return { score: Math.min(200, total), reasons };
}

router.get('/me', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const user = await User.findById(req.user._id).lean();
  res.json(user);
});

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

// POST /api/users/me/elo/recalc — force migrate + recalc elo (for testing)
router.post('/me/elo/recalc', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  try {
    await ensureEloSchema(req.user._id);
    const total = await recalcElo(req.user._id);
    const user = await User.findById(req.user._id).lean();
    res.json({ total, elo: user.elo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/me/resume — keyword-score resume text and set starting elo bonus
router.post('/me/resume', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const { resumeText } = req.body;
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
    return res.status(400).json({ error: 'resumeText must be at least 50 characters' });
  }

  try {
    const { score, reasons } = scoreResume(resumeText);
    await ensureEloSchema(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { 'elo.startingBonus': score });
    const newTotal = await recalcElo(req.user._id);
    res.json({ bonus: score, reasons, newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
