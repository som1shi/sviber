const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const IdeaVote = require('../models/IdeaVote');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const { recalcElo } = require('../lib/elo');

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
      .populate('founder', 'displayName avatar elo.total');

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

    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    const existing = await IdeaVote.findOne({ user: req.user._id, idea: req.params.id });

    let netDelta = 0;

    if (existing) {
      if (existing.value === value) {
        await existing.deleteOne();
        const field = value === 1 ? 'upvotes' : 'downvotes';
        await Idea.findByIdAndUpdate(req.params.id, { $inc: { [field]: -1, eloScore: -value } });
        User.findByIdAndUpdate(idea.founder, { $inc: { 'elo.stats.ideaNetVotes': -value } })
          .then(() => recalcElo(idea.founder))
          .catch(() => {});
        return res.json({ removed: true });
      } else {
        existing.value = value;
        await existing.save();
        const addField = value === 1 ? 'upvotes' : 'downvotes';
        const removeField = value === 1 ? 'downvotes' : 'upvotes';
        await Idea.findByIdAndUpdate(req.params.id, {
          $inc: { [addField]: 1, [removeField]: -1, eloScore: value * 2 },
        });
        netDelta = value * 2;
        // Update founder's ideaNetVotes and recalc (fire-and-forget)
        User.findByIdAndUpdate(idea.founder, { $inc: { 'elo.stats.ideaNetVotes': netDelta } })
          .then(() => recalcElo(idea.founder))
          .catch(() => {});
        return res.json({ updated: true, value });
      }
    }

    await IdeaVote.create({ user: req.user._id, idea: req.params.id, value });
    const field = value === 1 ? 'upvotes' : 'downvotes';
    await Idea.findByIdAndUpdate(req.params.id, { $inc: { [field]: 1, eloScore: value } });
    netDelta = value;

    User.findByIdAndUpdate(idea.founder, { $inc: { 'elo.stats.ideaNetVotes': netDelta } })
      .then(() => recalcElo(idea.founder))
      .catch(() => {});

    res.status(201).json({ created: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
