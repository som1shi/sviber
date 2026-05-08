const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Idea = require('../models/Idea');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const projects = await Project.find({ 'contributors.user': req.user._id })
      .populate('idea', 'title description tags projectUrl imageUrl imageUpload')
      .populate('contributors.user', 'name profilePic elo.total')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a draft project from a user upload form.
router.post('/draft', ensureAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      tags,
      projectUrl,
      imageUpload,
      imageUrl,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'title required' });

    const normalizedTags = Array.isArray(tags)
      ? tags
      : String(tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    const project = await Project.create({
      name: String(title).trim(),
      description: description ? String(description).trim() : '',
      tags: normalizedTags,
      projectUrl: projectUrl ? String(projectUrl).trim() : '',
      imageUpload: imageUpload || undefined,
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
      contributors: [{ user: req.user._id }],
      publishedToCommunity: false,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish a draft project to Community (creates/links an Idea post).
router.post('/:id/publish', ensureAuthenticated, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      'contributors.user': req.user._id,
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.idea) {
      // Already published; allow updating the community "post metadata"
      const { caption, notes, feedbackRequest, topic } = req.body || {};
      project.publishedToCommunity = true;
      await project.save();
      const already = await Idea.findOne({ _id: project.idea, founder: req.user._id });
      if (!already) return res.status(404).json({ error: 'Idea not found' });
      if (caption !== undefined) already.caption = String(caption || '').trim();
      if (notes !== undefined) already.notes = String(notes || '').trim();
      if (feedbackRequest !== undefined) already.feedbackRequest = String(feedbackRequest || '').trim();
      if (topic !== undefined) already.topic = String(topic || '').trim();
      await already.save();
      return res.json(already);
    }

    const { caption, notes, feedbackRequest, topic } = req.body || {};
    const idea = await Idea.create({
      founder: req.user._id,
      title: project.name,
      description: project.description || '',
      caption: String(caption || '').trim(),
      notes: String(notes || '').trim(),
      feedbackRequest: String(feedbackRequest || '').trim(),
      topic: String(topic || '').trim(),
      tags: project.tags || [],
      projectUrl: project.projectUrl || '',
      imageUpload: project.imageUpload || undefined,
      imageUrl: project.imageUrl || '',
      // status defaults to 'open' and will show up in Community hot feed.
    });

    project.idea = idea._id;
    project.publishedToCommunity = true;
    await project.save();

    res.status(201).json(idea);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, matchId, name, description } = req.body;
    if (!ideaId || !matchId || !name) {
      return res.status(400).json({ error: 'ideaId, matchId, and name required' });
    }
    const project = await Project.create({
      idea: ideaId,
      match: matchId,
      name,
      description,
      publishedToCommunity: true,
      contributors: [{ user: req.user._id }],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/tasks', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, assignee } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'contributors.user': req.user._id },
      { $push: { tasks: { title, description, assignee } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/tasks/:taskId', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'status must be todo, in_progress, or done' });
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'contributors.user': req.user._id, 'tasks._id': req.params.taskId },
      { $set: { 'tasks.$.status': status } },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project or task not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
