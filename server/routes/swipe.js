const express = require('express');
const router = express.Router();
const Swipe = require('../models/Swipe');
const Idea = require('../models/Idea');
const Match = require('../models/Match');
const User = require('../models/User');
const Survey = require('../models/Survey');
const { ensureAuthenticated } = require('../middleware/auth');

const SKILL_FIELDS = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing'];

const AMBITION_RANK = {
  'Lifestyle business': 1,
  'Solid acquisition ($1–10M)': 2,
  'Big exit ($10–100M)': 3,
  'Go big or go home (IPO)': 4,
};

const HOURS_RANK = {
  '< 20 hrs': 1, '20–40 hrs': 2, '40–60 hrs': 3, '60+ hrs': 4,
};

function skillComplementarity(surveyA, surveyB) {
  if (!surveyA?.skills || !surveyB?.skills) return 50;
  // High score = different strengths (complementary), low score = same strengths (redundant)
  let diffSum = 0;
  for (const field of SKILL_FIELDS) {
    const a = surveyA.skills.get ? (surveyA.skills.get(field) ?? 5) : (surveyA.skills[field] ?? 5);
    const b = surveyB.skills.get ? (surveyB.skills.get(field) ?? 5) : (surveyB.skills[field] ?? 5);
    diffSum += Math.abs(a - b);
  }
  // Max diff per field = 9, 5 fields = 45 max. Normalize to 0-100.
  return Math.round((diffSum / 45) * 100);
}

function ambitionAlignment(surveyA, surveyB) {
  if (!surveyA?.ambition || !surveyB?.ambition) return 50;
  const rankA = AMBITION_RANK[surveyA.ambition] ?? 2;
  const rankB = AMBITION_RANK[surveyB.ambition] ?? 2;
  // Same ambition = 100, off by 1 = 67, off by 2 = 33, off by 3 = 0
  return Math.max(0, Math.round(100 - Math.abs(rankA - rankB) * 33));
}

function commitmentMatch(surveyA, surveyB) {
  if (!surveyA?.hours || !surveyB?.hours) return 50;
  const rankA = HOURS_RANK[surveyA.hours] ?? 2;
  const rankB = HOURS_RANK[surveyB.hours] ?? 2;
  return Math.max(0, Math.round(100 - Math.abs(rankA - rankB) * 33));
}

async function computeMatchScore(userA, userB) {
  const [surveyA, surveyB] = await Promise.all([
    Survey.findOne({ userId: userA._id }),
    Survey.findOne({ userId: userB._id }),
  ]);

  const skillsFit        = skillComplementarity(surveyA, surveyB);
  const ambitionScore    = ambitionAlignment(surveyA, surveyB);
  const commitmentScore  = commitmentMatch(surveyA, surveyB);
  // ELO placeholder — weight it low until ELO system is live
  const eloPlaceholder   = 50;

  const total = Math.round(
    skillsFit       * 0.40 +
    ambitionScore   * 0.30 +
    commitmentScore * 0.20 +
    eloPlaceholder  * 0.10
  );

  return {
    ideaAlignment:  100,
    skillsFit,
    ambitionScore,
    commitmentScore,
    eloCompatibility: eloPlaceholder,
    total,
  };
}

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { ideaId, direction } = req.body;
    if (!ideaId || !['right', 'left', 'up'].includes(direction)) {
      return res.status(400).json({ error: 'ideaId and direction (right|left|up) required' });
    }

    const previousSwipe = await Swipe.findOne({ user: req.user._id, idea: ideaId });
    const swipe = await Swipe.findOneAndUpdate(
      { user: req.user._id, idea: ideaId },
      { direction },
      { upsert: true, new: true }
    );

    let match = null;

    if (direction === 'right') {
      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      if (previousSwipe?.direction !== 'right') {
        await Idea.findByIdAndUpdate(ideaId, { $inc: { builderCount: 1 } });
      }

      const otherSwipes = await Swipe.find({
        idea: ideaId,
        direction: 'right',
        user: { $ne: req.user._id },
      });

      const currentUser = await User.findById(req.user._id);

      for (const other of otherSwipes) {
        const exists = await Match.findOne({ idea: ideaId, users: { $all: [req.user._id, other.user] } });
        if (exists) continue;

        const otherUser = await User.findById(other.user);
        const score = await computeMatchScore(currentUser, otherUser);

        match = await Match.create({
          idea: ideaId,
          users: [req.user._id, other.user],
          score,
        });

        match = await match.populate([
          { path: 'idea', select: 'title description tags' },
          { path: 'users', select: 'displayName avatar role elo skills' },
        ]);
      }
    }

    res.json({ swipe, match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
