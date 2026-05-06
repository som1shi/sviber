const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const IdeaVote = require('../models/IdeaVote');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { tab = 'hot', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let sort = { eloScore: -1 };
    if (tab === 'new') sort = { createdAt: -1 };
    if (tab === 'building') sort = { builderCount: -1 };

    const filter = tab === 'building' ? { status: 'building' } : {};

    const ideas = await Idea.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('founder', 'name profilePic elo.total');

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const idea = await Idea.create({ founder: req.user._id, title, description, tags });
    res.status(201).json(idea);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/vote', ensureAuthenticated, async (req, res) => {
  try {
    const { value } = req.body;
    if (value !== 1 && value !== -1) return res.status(400).json({ error: 'value must be 1 or -1' });

    const existing = await IdeaVote.findOne({ user: req.user._id, idea: req.params.id });

    if (existing) {
      if (existing.value === value) {
        // toggle off
        await existing.deleteOne();
        const field = value === 1 ? 'upvotes' : 'downvotes';
        await Idea.findByIdAndUpdate(req.params.id, { $inc: { [field]: -1, eloScore: -value } });
        return res.json({ removed: true });
      } else {
        // flip vote
        existing.value = value;
        await existing.save();
        const addField = value === 1 ? 'upvotes' : 'downvotes';
        const removeField = value === 1 ? 'downvotes' : 'upvotes';
        await Idea.findByIdAndUpdate(req.params.id, {
          $inc: { [addField]: 1, [removeField]: -1, eloScore: value * 2 },
        });
        return res.json({ updated: true, value });
      }
    }

    await IdeaVote.create({ user: req.user._id, idea: req.params.id, value });
    const field = value === 1 ? 'upvotes' : 'downvotes';
    await Idea.findByIdAndUpdate(req.params.id, { $inc: { [field]: 1, eloScore: value } });
    res.status(201).json({ created: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
