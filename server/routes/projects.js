const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Idea = require('../models/Idea');
const { ensureAuthenticated } = require('../middleware/auth');
const { onProjectCompleted, onProjectAbandoned, onPeerRating } = require('../lib/elo');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const projects = await Project.find({ 'contributors.user': req.user._id })
      .populate('idea', 'title description tags')
      .populate('contributors.user', 'displayName avatar')
      .sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a draft project from a user upload form.
router.post('/draft', ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, tags, projectUrl, imageUpload, imageUrl } = req.body;

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
      const { caption, notes, feedbackRequest } = req.body || {};
      project.publishedToCommunity = true;
      await project.save();
      const already = await Idea.findOne({ _id: project.idea, founder: req.user._id });
      if (!already) return res.status(404).json({ error: 'Idea not found' });
      if (caption !== undefined) already.caption = String(caption || '').trim();
      if (notes !== undefined) already.notes = String(notes || '').trim();
      if (feedbackRequest !== undefined) already.feedbackRequest = String(feedbackRequest || '').trim();
      await already.save();
      return res.json(already);
    }

    const { caption, notes, feedbackRequest } = req.body || {};
    const idea = await Idea.create({
      founder: req.user._id,
      title: project.name,
      description: project.description || '',
      caption: String(caption || '').trim(),
      notes: String(notes || '').trim(),
      feedbackRequest: String(feedbackRequest || '').trim(),
      tags: project.tags || [],
      projectUrl: project.projectUrl || '',
      imageUpload: project.imageUpload || undefined,
      imageUrl: project.imageUrl || '',
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
      contributors: [{ user: req.user._id }],
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id/status — update project status and adjust elo for all contributors
router.patch('/:id/status', ensureAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'completed', 'abandoned'].includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, 'contributors.user': req.user._id },
      { status },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const contributorIds = project.contributors.map((c) => String(c.user));

    if (status === 'completed') {
      onProjectCompleted(contributorIds).catch(() => {});
    } else if (status === 'abandoned') {
      onProjectAbandoned(contributorIds).catch(() => {});
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/rate — rate a collaborator 1-5 after project ends
router.post('/:id/rate', ensureAuthenticated, async (req, res) => {
  try {
    const { toUserId, value } = req.body;
    if (!toUserId || !Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ error: 'toUserId and value (1-5) required' });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      'contributors.user': req.user._id,
      status: { $in: ['completed', 'abandoned'] },
    });
    if (!project) return res.status(404).json({ error: 'Project not found or not yet finished' });

    const isCollaborator = project.contributors.some(
      (c) => c.user.toString() === toUserId
    );
    if (!isCollaborator) return res.status(400).json({ error: 'Target user is not a contributor' });
    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot rate yourself' });
    }

    const alreadyRated = project.ratings.some(
      (r) => r.from.toString() === req.user._id.toString() && r.to.toString() === toUserId
    );
    if (alreadyRated) return res.status(409).json({ error: 'Already rated this user for this project' });

    project.ratings.push({ from: req.user._id, to: toUserId, value });
    await project.save();

    onPeerRating(toUserId, value).catch(() => {});

    res.json({ rated: true });
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
