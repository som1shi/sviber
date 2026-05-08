const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const { generateGeminiJson, getGeminiStatus } = require('../services/gemini');

const SKILL_FIELDS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing'];
const MAX_RESUME_CHARS = 30000;

function clampSkill(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 5;
  return Math.max(1, Math.min(10, Math.round(number)));
}

function cleanString(value, maxLength = 600) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeResumeProfile(raw) {
  const skills = {};
  const rawSkills = raw && typeof raw.skills === 'object' ? raw.skills : {};
  for (const field of SKILL_FIELDS) {
    skills[field] = clampSkill(rawSkills[field]);
  }

  return {
    role: cleanString(raw?.role, 80) || 'Builder',
    school: cleanString(raw?.school, 120),
    github: cleanString(raw?.github, 160),
    bio: cleanString(raw?.bio, 700),
    skills,
    strengths: cleanString(raw?.strengths, 700),
    weaknesses: cleanString(raw?.weaknesses, 700),
    resumeSummary: cleanString(raw?.resumeSummary, 900),
    tags: Array.isArray(raw?.tags) ? raw.tags.map((tag) => cleanString(tag, 40)).filter(Boolean).slice(0, 8) : [],
  };
}

function buildResumePrompt(resumeText) {
  return `You are parsing a founder resume for Sviber, a co-founder matching app.

Extract a concise founder profile from the resume. Infer only from the resume text. If something is not present, use an empty string or a neutral skill score.

Return ONLY valid JSON with this exact shape:
{
  "role": "short founder role, max 6 words",
  "school": "school or university if present",
  "github": "GitHub URL or username if present",
  "bio": "first-person founder bio, 35-70 words",
  "skills": {
    "Engineering": 1-10,
    "Product": 1-10,
    "Design": 1-10,
    "Sales": 1-10,
    "Marketing": 1-10
  },
  "strengths": "1-2 sentence summary of strongest founder traits",
  "weaknesses": "1 sentence of likely gaps or areas to complement",
  "resumeSummary": "3 bullet-style clauses in one string",
  "tags": ["up to 8 short tags"]
}

Resume:
${resumeText}`;
}

router.get('/status', (_req, res) => {
  res.json(getGeminiStatus());
});

router.post('/analyze', ensureAuthenticated, async (req, res) => {
  try {
    const resumeText = cleanString(req.body.resumeText || req.body.text, MAX_RESUME_CHARS);
    if (resumeText.length < 80) {
      return res.status(400).json({ error: 'resumeText must be at least 80 characters' });
    }

    const rawProfile = await generateGeminiJson(buildResumePrompt(resumeText));
    const profile = normalizeResumeProfile(rawProfile);

    if (req.body.save === true) {
      const userUpdate = {
        role: profile.role,
        bio: profile.bio,
      };
      if (profile.school) userUpdate.school = profile.school;
      if (profile.github) userUpdate.github = profile.github;

      const [user, survey] = await Promise.all([
        User.findByIdAndUpdate(req.user._id, userUpdate, { new: true }),
        Survey.findOneAndUpdate(
          { userId: req.user._id },
          {
            $set: {
              userId: req.user._id,
              skills: profile.skills,
              strengths: profile.strengths,
              weaknesses: profile.weaknesses,
            },
          },
          { upsert: true, new: true }
        ),
      ]);

      return res.json({ profile, saved: true, user, survey });
    }

    res.json({ profile, saved: false });
  } catch (err) {
    const status = /GEMINI_API_KEY/.test(err.message) ? 500 : 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
