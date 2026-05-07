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

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function normalizeIdeas(rawIdeas) {
  if (!Array.isArray(rawIdeas)) {
    throw new Error('Gemini returned JSON, but it was not an array');
  }

  return rawIdeas
    .map((idea) => ({
      title: String(idea.title || '').trim(),
      description: String(idea.description || '').trim(),
      tags: Array.isArray(idea.tags) ? idea.tags.slice(0, 2).map(String) : [],
      heat: Math.max(60, Math.min(99, Number(idea.heat) || 75)),
    }))
    .filter((idea) => idea.title && idea.description);
}

async function saveGeneratedIdeas(ideas) {
  if (!ideas.length) throw new Error('No usable ideas to save');

  const titles = ideas.map((idea) => idea.title);
  const existingTitles = new Set(
    (await Idea.find({ title: { $in: titles } }).distinct('title')).map((t) => t.toLowerCase())
  );

  const docs = ideas
    .filter((idea) => !existingTitles.has(idea.title.toLowerCase()))
    .map((idea) => ({
      title: idea.title,
      description: idea.description,
      tags: idea.tags,
      eloScore: idea.heat,
      isAiGenerated: true,
    }));

  if (!docs.length) return [];
  return Idea.insertMany(docs, { ordered: false });
}

async function generateBatch(count = 20) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set. Add it to server/.env or your host environment.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: getGeminiModelName() });

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

  return normalizeIdeas(JSON.parse(jsonMatch[0]));
}

router.get('/status', (req, res) => {
  res.json({
    configured: Boolean(getGeminiApiKey()),
    keyName: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null,
    model: getGeminiModelName(),
  });
});

// POST /api/generate-ideas - generate and save a batch
// Add ?force=true to bypass the daily seed check and run it immediately
router.post('/', async (req, res) => {
  try {
    if (req.query.force === 'true') {
      res.json({ message: 'Force seed started - check server logs' });
      return autoSeed(true);
    }
    const count = Math.min(Number(req.query.count) || 10, 20);
    const ideas = await generateBatch(count);
    const saved = await saveGeneratedIdeas(ideas);

    res.json({ generated: saved.length, ideas: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Runs once per day on server start.
// Generates 10 ideas across all 10 categories = ~100 fresh ideas per day.
// Ideas accumulate in the DB, so all users share the same growing pool.
async function autoSeed(force = false) {
  if (!getGeminiApiKey()) {
    console.warn('Skipping Gemini seed: GEMINI_API_KEY not set.');
    return;
  }
  try {
    const count = await Idea.countDocuments();
    if (!force && count >= 50) {
      console.log(`DB has ${count} ideas - skipping seed.`);
      return;
    }

    console.log(`DB has ${count} ideas - generating 20 more with Gemini...`);
    const ideas = await generateBatch(20);
    const saved = await saveGeneratedIdeas(ideas);
    console.log(`Seed complete - ${saved.length} new ideas added. DB now has ${count + saved.length}.`);
  } catch (err) {
    console.error('autoSeed failed:', err.message);
  }
}

module.exports = { router, autoSeed, generateBatch };
