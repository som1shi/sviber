const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { ensureAuthenticated } = require('../middleware/auth');

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
