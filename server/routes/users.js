const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const User = require('../models/User');
const { recalcElo } = require('../lib/elo');

const anthropic = new Anthropic();

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

// POST /api/users/me/resume — parse resume text and set starting elo bonus
router.post('/me/resume', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const { resumeText } = req.body;
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
    return res.status(400).json({ error: 'resumeText must be at least 50 characters' });
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Score this resume for a startup/project collaboration platform. Return ONLY valid JSON, no other text.

Scoring rubric (additive, total 0–200):
- Launched product with real users: +50
- Founded or co-founded a startup: +40
- YC or top accelerator alumni: +60
- Open source project with 1k+ stars: +30
- Relevant internship at a known company: +20
- Hackathon wins: +15
- Active GitHub (consistent contributions visible): +10

Be conservative — most resumes score 0–80. Cap at 200.

Return: {"score": <integer 0-200>, "reasons": ["<short reason>", ...]}

Resume:
${resumeText.slice(0, 4000)}`,
      }],
    });

    let parsed;
    try {
      parsed = JSON.parse(message.content[0].text);
    } catch {
      return res.status(502).json({ error: 'Failed to parse Claude response' });
    }

    const bonus = Math.max(0, Math.min(200, Math.round(parsed.score ?? 0)));
    await User.findByIdAndUpdate(req.user._id, { 'elo.startingBonus': bonus });
    const newTotal = await recalcElo(req.user._id);

    res.json({ bonus, reasons: parsed.reasons ?? [], newTotal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
