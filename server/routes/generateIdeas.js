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

async function generateBatch(count = 10) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const tags = TAGS_MAP[category];

  const prompt = `Generate ${count} unique, specific, and compelling startup ideas in the category: "${category}".

For each idea return a JSON object with:
- title: short punchy name (max 8 words)
- description: 1-2 sentence pitch that explains the problem and solution (max 40 words)
- tags: array of 2 tags from this list: ${JSON.stringify(tags)}
- heat: integer 60-99 representing market excitement

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"title":"...","description":"...","tags":["..."],"heat":85}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in Gemini response');

  return JSON.parse(jsonMatch[0]);
}

// POST /api/generate-ideas — generate and save a batch
router.post('/', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }
  try {
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

// Called on server start to seed ideas if the DB is low
async function autoSeed(minCount = 15) {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const count = await Idea.countDocuments();
    if (count >= minCount) return;

    console.log(`Only ${count} ideas in DB — generating more with Gemini...`);
    const ideas = await generateBatch(10);
    await Idea.insertMany(
      ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        eloScore: idea.heat || 75,
        isAiGenerated: true,
      }))
    );
    console.log(`Seeded ${ideas.length} AI-generated ideas.`);
  } catch (err) {
    console.error('autoSeed failed:', err.message);
  }
}

module.exports = { router, autoSeed };
