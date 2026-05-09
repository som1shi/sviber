const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const Idea = require('../models/Idea');

const TAGS = ['AI', 'DevTools', 'Fintech', 'Consumer', 'EdTech', 'Creator', 'B2B', 'SaaS', 'Climate', 'Health', 'Marketplace', 'Social', 'API'];

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function parseIdeas(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array in response');
  const raw = JSON.parse(match[0]);
  if (!Array.isArray(raw)) throw new Error('Response was not an array');
  return raw
    .map((idea) => ({
      title: String(idea.title || '').trim(),
      description: String(idea.description || '').trim(),
      tags: Array.isArray(idea.tags) ? idea.tags.slice(0, 2).map(String) : [],
      heat: Math.max(60, Math.min(99, Number(idea.heat) || 75)),
    }))
    .filter((idea) => idea.title && idea.description);
}

async function saveIdeas(ideas) {
  if (!ideas.length) return [];
  const titles = ideas.map((i) => i.title);
  const existing = new Set(
    (await Idea.find({ title: { $in: titles } }).distinct('title')).map((t) => t.toLowerCase())
  );
  const docs = ideas
    .filter((i) => !existing.has(i.title.toLowerCase()))
    .map((i) => ({ title: i.title, description: i.description, tags: i.tags, eloScore: i.heat, isAiGenerated: true }));
  if (!docs.length) return [];
  return Idea.insertMany(docs, { ordered: false });
}

// Refine a rough user-submitted prompt into a polished idea card
async function refineUserIdea(prompt) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a startup idea refiner. Take a rough idea and turn it into a vivid, specific startup card that makes a builder excited.
Return ONLY a single JSON object (not an array) with:
- title: short punchy product name (max 8 words), like "Cursor but for design" or "Ramp for college students"
- description: 2-3 punchy sentences. First: name the exact pain point with a specific example. Second: explain the solution concisely. Third (optional): one sharp insight about why now or who pays. Max 60 words total. Write like a YC founder, not a press release.
- tags: array of exactly 2 tags from: ${JSON.stringify(TAGS)}
- heat: integer 60-99 representing market excitement

No markdown, no explanation. Just the JSON object.`,
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 400,
  });

  const text = completion.choices[0].message.content.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse idea from response');
  const raw = JSON.parse(jsonMatch[0]);
  return {
    title: String(raw.title || '').trim(),
    description: String(raw.description || '').trim(),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 2).map(String) : [],
    heat: Math.max(60, Math.min(99, Number(raw.heat) || 75)),
  };
}

// Generate a batch of ideas autonomously
async function generateBatch(count = 20) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You are a startup idea generator. Generate vivid, specific startup ideas that make builders excited.
Return ONLY a valid JSON array. Each object must have:
- title: short punchy product name (max 8 words), like "Cursor but for design" or "Ramp for college students"
- description: 2-3 punchy sentences. First: name the exact pain point with a specific example. Second: explain the solution. Third (optional): one sharp insight about why now or who pays. Max 60 words. Write like a YC founder, not a press release.
- tags: array of exactly 2 tags from: ${JSON.stringify(TAGS)}
- heat: integer 60-99

No markdown, no explanation. Just the JSON array.`,
      },
      {
        role: 'user',
        content: `Generate ${count} unique startup ideas spread across different categories.`,
      },
    ],
    max_tokens: 8192,
  });

  const text = completion.choices[0].message.content.trim();
  return parseIdeas(text);
}

// POST /api/generate-ideas — user submits a rough prompt, Groq refines it into a card
router.post('/', async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set' });
  }
  try {
    const { prompt } = req.body;

    if (prompt?.trim()) {
      // User-submitted idea — refine it, then upsert so duplicates still return the idea
      const refined = await refineUserIdea(prompt.trim());
      let idea = await Idea.findOne({ title: { $regex: new RegExp(`^${refined.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (!idea) {
        idea = await Idea.create({
          title: refined.title,
          description: refined.description,
          tags: refined.tags,
          eloScore: refined.heat,
          isAiGenerated: true,
        });
      }
      return res.json({ generated: 1, ideas: [idea], source: 'user' });
    }

    // No prompt — generate a fresh batch
    const ideas = await generateBatch(20);
    const saved = await saveIdeas(ideas);
    res.json({ generated: saved.length, ideas: saved, source: 'auto' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-seed on server start if DB is low
async function autoSeed() {
  if (!process.env.GROQ_API_KEY) return;
  try {
    const count = await Idea.countDocuments();
    if (count >= 50) {
      console.log(`DB has ${count} ideas — skipping seed.`);
      return;
    }
    console.log(`DB has ${count} ideas — generating with Groq...`);
    const ideas = await generateBatch(20);
    const saved = await saveIdeas(ideas);
    console.log(`Seeded ${saved.length} ideas. DB now has ${count + saved.length}.`);
  } catch (err) {
    console.error('autoSeed failed:', err.message);
  }
}

module.exports = { router, autoSeed };
