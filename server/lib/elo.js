const User = require('../models/User');

const BASE = 1000;

const EMPTY_STATS = {
  projectsLaunched: 0, projectsAbandoned: 0,
  matchesCollab: 0,    matchesPassed: 0,
  totalSwipes: 0,      rightSwipes: 0,
  peerRatingSum: 0,    peerRatingCount: 0,
  ideaNetVotes: 0,
};

const EMPTY_ELO = {
  total: 1000,
  breakdown: { reliability: 50, quality: 50, activity: 50 },
  stats: EMPTY_STATS,
  startingBonus: 0,
  lastActive: new Date(),
};

// Migrates legacy users who still have elo as a flat number
async function ensureEloSchema(userIds) {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  await User.updateMany(
    { _id: { $in: ids }, 'elo.total': { $exists: false } },
    { $set: { elo: EMPTY_ELO } }
  );
}

function computeReliability(stats) {
  const total = stats.projectsLaunched + stats.projectsAbandoned;
  if (total === 0) return 50;
  return Math.round((stats.projectsLaunched / total) * 100);
}

function computeQuality(stats) {
  const ratingScore = stats.peerRatingCount > 0
    ? (stats.peerRatingSum / stats.peerRatingCount / 5) * 100
    : 50;
  const ideaScore = Math.min(100, Math.max(0, 50 + stats.ideaNetVotes));
  return Math.round(ratingScore * 0.6 + ideaScore * 0.4);
}

function computeActivity(stats) {
  // Build rate: turning collab matches into launched projects (most important)
  const buildRate = stats.matchesCollab > 0
    ? Math.min(100, Math.round((stats.projectsLaunched / stats.matchesCollab) * 100))
    : 50;
  // Swipe engagement: only kicks in after 20 swipes so early use doesn't swing it.
  // Penalizes denying everything, rewards genuine engagement — but capped 30-70 so
  // it can never dominate the score.
  const swipeEngagement = stats.totalSwipes >= 20
    ? Math.min(70, Math.max(30, Math.round((stats.rightSwipes / stats.totalSwipes) * 100)))
    : 50;
  return Math.round(buildRate * 0.75 + swipeEngagement * 0.25);
}

function computeDecay(lastActive) {
  const days = (Date.now() - new Date(lastActive)) / 86400000;
  if (days < 14) return 0;
  return Math.min(200, Math.round((days - 14) * 2));
}

function computeTotal(breakdown, startingBonus, lastActive) {
  // Reliability weighted highest — actually finishing things matters most
  const bucketAdj =
    (breakdown.reliability - 50) * 0.45 +
    (breakdown.quality     - 50) * 0.35 +
    (breakdown.activity    - 50) * 0.20;
  const decay = computeDecay(lastActive);
  return Math.max(0, Math.round(BASE + startingBonus + bucketAdj - decay));
}

async function recalcElo(userId) {
  await ensureEloSchema(userId);
  const user = await User.findById(userId);
  if (!user) return;
  // Safe defaults in case sub-fields are missing
  const s = user.elo.stats ?? {};
  const stats = Object.fromEntries(
    Object.keys(EMPTY_STATS).map((k) => [k, s[k] ?? 0])
  );
  const startingBonus = user.elo.startingBonus ?? 0;
  const lastActive    = user.elo.lastActive    ?? new Date();
  const breakdown = {
    reliability: computeReliability(stats),
    quality:     computeQuality(stats),
    activity:    computeActivity(stats),
  };
  const total = computeTotal(breakdown, startingBonus, lastActive);
  await User.findByIdAndUpdate(userId, {
    'elo.breakdown':  breakdown,
    'elo.total':      total,
    'elo.lastActive': new Date(),
  });
  return total;
}

// ── Event helpers — call these from routes instead of raw $inc ───────────────

async function onSwipe(userId, isRight) {
  await ensureEloSchema([userId]);
  const inc = { 'elo.stats.totalSwipes': 1 };
  if (isRight) inc['elo.stats.rightSwipes'] = 1;
  await User.findByIdAndUpdate(userId, { $inc: inc });
  return recalcElo(userId);
}

async function onMatchCollab(userIds) {
  await ensureEloSchema(userIds);
  await User.updateMany({ _id: { $in: userIds } }, { $inc: { 'elo.stats.matchesCollab': 1 } });
  await Promise.all(userIds.map(recalcElo));
}

async function onMatchPassed(userId) {
  await ensureEloSchema([userId]);
  await User.findByIdAndUpdate(userId, { $inc: { 'elo.stats.matchesPassed': 1 } });
  return recalcElo(userId);
}

async function onProjectCompleted(userIds) {
  await ensureEloSchema(userIds);
  await User.updateMany({ _id: { $in: userIds } }, { $inc: { 'elo.stats.projectsLaunched': 1 } });
  await Promise.all(userIds.map(recalcElo));
}

async function onProjectAbandoned(userIds) {
  await ensureEloSchema(userIds);
  await User.updateMany({ _id: { $in: userIds } }, { $inc: { 'elo.stats.projectsAbandoned': 1 } });
  await Promise.all(userIds.map(recalcElo));
}

async function onPeerRating(userId, value) {
  await ensureEloSchema([userId]);
  await User.findByIdAndUpdate(userId, {
    $inc: { 'elo.stats.peerRatingSum': value, 'elo.stats.peerRatingCount': 1 },
  });
  return recalcElo(userId);
}

async function onIdeaVote(founderId, delta) {
  await ensureEloSchema([founderId]);
  await User.findByIdAndUpdate(founderId, { $inc: { 'elo.stats.ideaNetVotes': delta } });
  return recalcElo(founderId);
}

module.exports = { recalcElo, ensureEloSchema, onSwipe, onMatchCollab, onMatchPassed, onProjectCompleted, onProjectAbandoned, onPeerRating, onIdeaVote };
