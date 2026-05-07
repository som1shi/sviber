const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const User = require('../models/User');
const { recalcElo, ensureEloSchema } = require('../lib/elo');
const { ensureAuthenticated } = require('../middleware/auth');
const Groq = require('groq-sdk');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function meShape(u) {
  if (!u) return u;
  const o = typeof u.toObject === 'function' ? u.toObject() : { ...u };
  const eloTotal =
    o.elo && typeof o.elo === 'object' && 'total' in o.elo ? o.elo.total : Number(o.elo) || 1000;
  return {
    ...o,
    // legacy aliases kept for any callers that still use old names
    displayName: o.name,
    avatar: o.profilePic,
    github: o.githubLink || '',
    role: o.title || '',
    // elo as number for badge displays; eloDetail has breakdown + history
    elo: eloTotal,
    eloDetail: o.elo,
  };
}

async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  return buffer.toString('utf8');
}

async function scoreResume(text) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const groq = new Groq({ apiKey });

  const prompt = `You are evaluating a founder resume to assign a starting bonus score (0–200) for a co-founder matching app.

Score based on these signals:
- Launched a product with real/live users: up to 50 pts
- Co-founded or founded a startup: up to 40 pts
- Top accelerator or investor (YC, Techstars, a16z, Sequoia): up to 60 pts
- Significant open source project (many stars): up to 30 pts
- Relevant internship experience: up to 20 pts
- Hackathon win: up to 15 pts
- Active GitHub / open source contributions: up to 10 pts

Resume:
"""
${text.slice(0, 3000)}
"""

Reply with JSON only, no markdown:
{"score": <number 0-200>, "reasons": ["reason1", "reason2"]}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return {
    score: Math.min(200, Math.max(0, Math.round(parsed.score))),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
  };
}

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

router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    if (req.params.id === 'me') {
      return res.status(400).json({ error: 'Use PUT /api/users/me' });
    }
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = ['name', 'profilePic', 'title', 'school', 'bio', 'githubLink', 'skills', 'primaryRole'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    res.json(meShape(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.post('/me/resume', (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  next();
}, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const text = await extractText(req.file.buffer, req.file.mimetype);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from file' });
    }
    const { score, reasons } = await scoreResume(text);
    await ensureEloSchema(req.user._id);
    await User.findByIdAndUpdate(req.user._id, { 'elo.startingBonus': score });
    const newTotal = await recalcElo(req.user._id, 'resume upload');
    res.json({ bonus: score, reasons, newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
