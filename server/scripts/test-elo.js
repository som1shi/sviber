// Run with: node scripts/test-elo.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Idea = require('../models/Idea');
const Survey = require('../models/Survey');
const Match = require('../models/Match');
const Project = require('../models/Project');
const { recalcElo } = require('../lib/elo');
const { structuredScore } = require('../lib/matching');

const log = (label, val) => console.log(`\n[${label}]`, JSON.stringify(val, null, 2));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Clean up any leftover test data ──────────────────────────────────────
  await Promise.all([
    User.deleteMany({ googleId: /^test-elo-/ }),
    Idea.deleteMany({ title: /^\[TEST\]/ }),
    Survey.deleteMany({}),  // fine in dev
    Match.deleteMany({}),
    Project.deleteMany({ name: /^\[TEST\]/ }),
  ]);

  // ── 1. Create two test users ──────────────────────────────────────────────
  const [userA, userB] = await User.insertMany([
    { googleId: 'test-elo-A', displayName: 'Alice Test', email: 'alice@test.com' },
    { googleId: 'test-elo-B', displayName: 'Bob Test',   email: 'bob@test.com' },
  ]);
  console.log('\n✓ Created users:', userA.displayName, userB.displayName);

  // ── 2. Resume bonus ───────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userA._id, { 'elo.startingBonus': 80 });
  let total = await recalcElo(userA._id);
  log('After resume bonus (+80)', { total });

  // ── 3. Swipe tracking ─────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userA._id, {
    $inc: { 'elo.stats.totalSwipes': 10, 'elo.stats.rightSwipes': 3 },
  });
  total = await recalcElo(userA._id);
  log('After 10 swipes (3 right → selective swiper)', { total });

  // ── 4. Idea votes ─────────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userA._id, {
    $inc: { 'elo.stats.ideaNetVotes': 15 },
  });
  total = await recalcElo(userA._id);
  log('After +15 net upvotes on ideas', { total });

  // ── 5. Match collab ───────────────────────────────────────────────────────
  await User.updateMany(
    { _id: { $in: [userA._id, userB._id] } },
    { $inc: { 'elo.stats.matchesCollab': 2 } }
  );
  total = await recalcElo(userA._id);
  log('After 2 collab matches', { total });

  // ── 6. Project launched ───────────────────────────────────────────────────
  await User.updateMany(
    { _id: { $in: [userA._id, userB._id] } },
    { $inc: { 'elo.stats.projectsLaunched': 1 } }
  );
  total = await recalcElo(userA._id);
  log('After 1 launched project', { total });

  // ── 7. Peer rating ────────────────────────────────────────────────────────
  await User.findByIdAndUpdate(userA._id, {
    $inc: { 'elo.stats.peerRatingSum': 9, 'elo.stats.peerRatingCount': 2 }, // avg 4.5/5
  });
  total = await recalcElo(userA._id);
  const finalUser = await User.findById(userA._id);
  log('Final elo after peer ratings (avg 4.5)', {
    total: finalUser.elo.total,
    breakdown: finalUser.elo.breakdown,
    stats: finalUser.elo.stats,
  });

  // ── 8. Survey-based match score ───────────────────────────────────────────
  await Survey.insertMany([
    {
      userId: userA._id,
      skills: { Engineering: 9, Product: 3, Design: 2, Sales: 4, Marketing: 3 },
      hours: '40–60 hrs',
      ambition: 'Go big or go home (IPO)',
      funding: 'Seed (~$2M)',
      runway: '12+ months',
      strengths: 'I move fast and ship, great at system design',
      weaknesses: 'Not great at sales pitches',
      culture: 'Relentlessly focused, high ownership',
      conflict: 'Address it directly and early',
    },
    {
      userId: userB._id,
      skills: { Engineering: 2, Product: 8, Design: 7, Sales: 9, Marketing: 8 },
      hours: '40–60 hrs',
      ambition: 'Go big or go home (IPO)',
      funding: 'Seed (~$2M)',
      runway: '6–12 months',
      strengths: 'Great at talking to users, strong at GTM',
      weaknesses: 'Weak on technical side',
      culture: 'Move fast, high accountability',
      conflict: 'I prefer direct conversations early',
    },
  ]);

  const [surveyA, surveyB] = await Promise.all([
    Survey.findOne({ userId: userA._id }),
    Survey.findOne({ userId: userB._id }),
  ]);
  const userAFull = await User.findById(userA._id);
  const userBFull = await User.findById(userB._id);

  const score = structuredScore(surveyA, surveyB, userAFull, userBFull);
  log('Survey match score (Alice=eng, Bob=biz, same vision)', score);

  // ── 9. Mismatched vision score for comparison ─────────────────────────────
  const mismatchSurvey = { ...surveyB.toObject(), ambition: 'Lifestyle business', funding: 'Bootstrap it' };
  const mismatchScore = structuredScore(surveyA, mismatchSurvey, userAFull, userBFull);
  log('Mismatched vision score (IPO vs lifestyle)', { total: mismatchScore.total, visionAlignment: mismatchScore.visionAlignment });

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({ googleId: /^test-elo-/ }),
    Idea.deleteMany({ title: /^\[TEST\]/ }),
    Survey.deleteMany({ userId: { $in: [userA._id, userB._id] } }),
  ]);
  console.log('\n✓ Cleaned up test data');
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => { console.error(err); process.exit(1); });
