const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const IdeaVote = require('../models/IdeaVote');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { tab = 'hot', page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user?._id ? String(req.user._id) : null;

    let sort = { eloScore: -1 };
    if (tab === 'new') sort = { createdAt: -1 };
    if (tab === 'building') sort = { builderCount: -1 };

    const filter = {};
    if (tab === 'building') filter.status = 'building';
    if (tab === 'mine') {
      if (!userId) return res.status(401).json({ error: 'Sign in required for mine tab' });
      filter.founder = userId;
    }
    if (req.query.excludeOwn === 'true' && userId) {
      filter.founder = { $ne: userId };
    }

    let blockedIdeaIds = [];
    if (req.query.excludeSwiped === 'true' && userId) {
      const Swipe = require('../models/Swipe');
      const swipes = await Swipe.find({ user: userId }).select('idea').lean();
      blockedIdeaIds = swipes.map((s) => s.idea);
    }
    if (blockedIdeaIds.length > 0) {
      filter._id = { $nin: blockedIdeaIds };
    }

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
    const { title, description, caption, notes, feedbackRequest, tags, projectUrl, imageUrl, imageUpload } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const normalizedTags = Array.isArray(tags)
      ? tags
      : String(tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    const idea = await Idea.create({
      founder: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      caption: String(caption || '').trim(),
      notes: String(notes || '').trim(),
      feedbackRequest: String(feedbackRequest || '').trim(),
      tags: normalizedTags,
      projectUrl: String(projectUrl || '').trim(),
      imageUrl: String(imageUrl || '').trim(),
      imageUpload: imageUpload || undefined,
    });
    res.status(201).json(idea);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, founder: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    const { title, description, caption, notes, feedbackRequest, tags, projectUrl, imageUrl, imageUpload, status } = req.body;
    if (title !== undefined) idea.title = String(title).trim();
    if (description !== undefined) idea.description = String(description).trim();
    if (caption !== undefined) idea.caption = String(caption || '').trim();
    if (notes !== undefined) idea.notes = String(notes || '').trim();
    if (feedbackRequest !== undefined) idea.feedbackRequest = String(feedbackRequest || '').trim();
    if (tags !== undefined) {
      idea.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : String(tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
    }
    if (projectUrl !== undefined) idea.projectUrl = String(projectUrl || '').trim();
    if (imageUrl !== undefined) idea.imageUrl = String(imageUrl || '').trim();
    if (imageUpload !== undefined) idea.imageUpload = imageUpload || undefined;
    if (status !== undefined && ['open', 'building', 'launched'].includes(status)) {
      idea.status = status;
    }

    await idea.save();
    res.json(idea);
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
