const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const User = require('../models/User');
const { recalcElo, ensureEloSchema, onSwipe } = require('../lib/elo');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
  const apiKey = process.env.GEMINI_URI;
  if (!apiKey) throw new Error('GEMINI_URI not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

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

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim().replace(/^```json\n?|```$/g, '');
  const parsed = JSON.parse(raw);
  return {
    score: Math.min(200, Math.max(0, Math.round(parsed.score))),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
  };
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

// POST /api/users/me/resume — upload PDF/DOCX resume, score with Gemini, set starting elo bonus
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
    const newTotal = await recalcElo(req.user._id);
    res.json({ bonus: score, reasons, newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
