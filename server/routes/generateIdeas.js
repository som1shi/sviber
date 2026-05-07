const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Idea = require('../models/Idea');

const CATEGORIES = [
  'AI tools for developers', 'fintech for Gen Z', 'edtech and learning',
  'creator economy', 'B2B SaaS', 'climate tech', 'health and wellness',
  'marketplace ideas', 'consumer social', 'devtools and infrastructure',
];

const TAGS_MAP = {
  'AI tools for developers': ['AI', 'DevTools'],
  'fintech for Gen Z': ['Fintech', 'Consumer'],
  'edtech and learning': ['EdTech', 'AI'],
  'creator economy': ['Creator', 'Consumer'],
  'B2B SaaS': ['B2B', 'SaaS'],
  'climate tech': ['Climate', 'B2B'],
  'health and wellness': ['Health', 'Consumer'],
  'marketplace ideas': ['Marketplace', 'B2B'],
  'consumer social': ['Social', 'Consumer'],
  'devtools and infrastructure': ['DevTools', 'API'],
};


async function generateBatch(count = 20) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const allTags = [...new Set(Object.values(TAGS_MAP).flat())];

  const prompt = `Generate ${count} unique, specific, and compelling startup ideas. Spread them across these categories: ${CATEGORIES.join(', ')}.

For each idea return a JSON object with:
- title: short punchy name (max 8 words)
- description: 1-2 sentence pitch explaining the problem and solution (max 40 words)
- tags: array of exactly 2 tags chosen from: ${JSON.stringify(allTags)}
- heat: integer 60-99 representing market excitement

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"title":"...","description":"...","tags":["AI","DevTools"],"heat":85}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in response');

  return JSON.parse(jsonMatch[0]);
}

// POST /api/generate-ideas — generate and save a batch
// Add ?force=true to bypass the daily seed check and run it immediately
router.post('/', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }
  try {
    if (req.query.force === 'true') {
      res.json({ message: 'Force seed started — check server logs' });
      return autoSeed(true);
    }
    const count = Math.min(Number(req.query.count) || 10, 20);
    const ideas = await generateBatch(count);

    const saved = await Idea.insertMany(
      ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        eloScore: idea.heat || 75,
        isAiGenerated: true,
      }))
    );

    res.json({ generated: saved.length, ideas: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Runs once per day on server start.
// Generates 10 ideas across all 10 categories = ~100 fresh ideas per day.
// Ideas accumulate in the DB — all users share the same growing pool.
async function autoSeed(force = false) {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    if (!force) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alreadySeededToday = await Idea.exists({
        isAiGenerated: true,
        createdAt: { $gte: today },
      });
      if (alreadySeededToday) {
        console.log('Daily idea seed already ran today — skipping.');
        return;
      }
    }

    console.log('Running daily idea seed...');
    const ideas = await generateBatch(20);
    await Idea.insertMany(
      ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        eloScore: idea.heat || 75,
        isAiGenerated: true,
      }))
    );
    console.log(`Daily seed complete — ${ideas.length} new ideas added to the pool.`);
  } catch (err) {
    console.error('autoSeed failed:', err.message);
  }
}

module.exports = { router, autoSeed };
