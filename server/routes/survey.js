const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');

router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const survey = await Survey.findOne({ userId: req.user._id }).lean();
  res.json(survey || null);
});

router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not logged in' });
  const survey = await Survey.findOneAndUpdate(
    { userId: req.user._id },
    { ...req.body, userId: req.user._id },
    { upsert: true, new: true }
  );
  res.json(survey);
});

module.exports = router;
