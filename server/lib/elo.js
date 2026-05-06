const User = require('../models/User');

const BASE = 1000;

function computeReliability(stats) {
  const total = stats.projectsLaunched + stats.projectsAbandoned;
  if (total === 0) return 50;
  return Math.round((stats.projectsLaunched / total) * 100);
}

function computeQuality(stats) {
  const ratingScore = stats.peerRatingCount > 0
    ? (stats.peerRatingSum / stats.peerRatingCount / 5) * 100
    : 50;
  // ideaNetVotes: each net upvote nudges score up to 1pt, clamped 0-100
  const ideaScore = Math.min(100, Math.max(0, 50 + stats.ideaNetVotes));
  return Math.round(ratingScore * 0.6 + ideaScore * 0.4);
}

function computeActivity(stats) {
  // More selective swipers (lower right-swipe %) score higher
  const selectivity = stats.totalSwipes > 0
    ? Math.round((1 - stats.rightSwipes / stats.totalSwipes) * 100)
    : 50;
  // How often collab matches turn into launched projects
  const buildRate = stats.matchesCollab > 0
    ? Math.min(100, Math.round((stats.projectsLaunched / stats.matchesCollab) * 100))
    : 50;
  return Math.round((selectivity + buildRate) / 2);
}

function computeDecay(lastActive) {
  const days = (Date.now() - new Date(lastActive)) / 86400000;
  if (days < 14) return 0;
  // -2 pts/day after 2-week grace period, capped at -200
  return Math.min(200, Math.round((days - 14) * 2));
}

function computeTotal(breakdown, startingBonus, lastActive) {
  // Each bucket contributes its deviation from neutral (50), weighted
  const bucketAdj =
    (breakdown.reliability - 50) * 0.35 +
    (breakdown.quality     - 50) * 0.35 +
    (breakdown.activity    - 50) * 0.30;
  const decay = computeDecay(lastActive);
  return Math.max(0, Math.round(BASE + startingBonus + bucketAdj - decay));
}

async function recalcElo(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  const { stats, startingBonus, lastActive } = user.elo;
  const breakdown = {
    reliability: computeReliability(stats),
    quality:     computeQuality(stats),
    activity:    computeActivity(stats),
  };
  const total = computeTotal(breakdown, startingBonus, lastActive);
  await User.findByIdAndUpdate(userId, {
    'elo.breakdown': breakdown,
    'elo.total':     total,
    'elo.lastActive': new Date(),
  });
  return total;
}

module.exports = { recalcElo };
