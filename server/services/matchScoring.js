/**
 * Sviber matching score (0–100 total) from four signals:
 * Same idea 40%, Skills fit 30%, Similar ELO 20%, Active lately 10%.
 */

const ROLE_COMPLEMENTS = {
  FE: ['BE', 'DESIGN', 'PM'],
  BE: ['FE', 'AI', 'PM'],
  AI: ['BE', 'FE', 'PM'],
  DESIGN: ['FE', 'GTM', 'PM'],
  GTM: ['DESIGN', 'PM', 'FE'],
  PM: ['FE', 'BE', 'AI', 'DESIGN', 'GTM'],
};

function jaccard(a = [], b = []) {
  const A = new Set((a || []).map((s) => String(s).toLowerCase().trim()));
  const B = new Set((b || []).map((s) => String(s).toLowerCase().trim()));
  if (A.size === 0 && B.size === 0) return 0;
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/** Raw 0–1 skills complementarity (not weighted). */
function skillsFitNormalized(userA, userB) {
  const roleA = userA.primaryRole || 'PM';
  const roleB = userB.primaryRole || 'PM';

  const overlap = jaccard(userA.skills, userB.skills);
  const complementary = ROLE_COMPLEMENTS[roleA]?.includes(roleB) ? 0.6 : 0.25;
  const overlapBonus =
    overlap >= 0.15 && overlap <= 0.55 ? 0.2 : overlap > 0 ? 0.1 : 0;
  const nonCloneBonus = overlap < 0.72 ? 0.2 : 0;

  let raw = complementary + overlapBonus + nonCloneBonus;
  if (roleA === roleB && overlap > 0.7) raw *= 0.62;
  return clamp01(raw);
}

/** Raw 0–1 ELO similarity (not weighted). */
function eloSimilarityNormalized(eloA, eloB) {
  const a = Number(eloA?.total ?? eloA ?? 0);
  const b = Number(eloB?.total ?? eloB ?? 0);
  const diff = Math.abs(a - b);
  return clamp01(Math.exp(-diff / 300));
}

/** Raw 0–1 activity from last swipe / profile activity time. */
function activityNormalized(userDoc, fallbackDate, now) {
  const t =
    userDoc.lastSwipeAt ||
    userDoc.lastActiveAt ||
    fallbackDate ||
    userDoc.updatedAt ||
    userDoc.createdAt;
  const ref = t ? new Date(t) : now;
  const ms = Math.max(0, now.getTime() - ref.getTime());
  const hours = Math.min(ms / (1000 * 60 * 60), 168);
  return clamp01(1 - hours / 168);
}

/**
 * pairKey avoids duplicate Match docs for the same idea + user pair.
 */
function matchPairKey(ideaId, userIdA, userIdB) {
  const [x, y] = [String(userIdA), String(userIdB)].sort();
  return `${String(ideaId)}:${x}:${y}`;
}

/**
 * Returns score fields matching Match schema (integer 0–100 per dimension + total).
 * @param {object} userA - Mongoose doc or plain { elo, skills, primaryRole, lastActiveAt, ... }
 * @param {object} userB
 * @param {object} options
 * @param {boolean} [options.sameIdea=true]
 * @param {Date} [options.now]
 * @param {Date} [options.userALastSwipe] - optional Swipe.updatedAt for A
 * @param {Date} [options.userBLastSwipe]
 */
function computeMatchScore(userA, userB, options = {}) {
  const sameIdea = options.sameIdea !== false;
  const now = options.now instanceof Date ? options.now : new Date();

  const I = sameIdea ? 1 : 0;
  const S = skillsFitNormalized(userA, userB);
  const E = eloSimilarityNormalized(userA.elo, userB.elo);
  const aA = activityNormalized(
    userA,
    options.userALastSwipe || userA.lastSwipeAt,
    now
  );
  const aB = activityNormalized(
    userB,
    options.userBLastSwipe || userB.lastSwipeAt,
    now
  );
  const A = (aA + aB) / 2;

  const weighted = 0.4 * I + 0.3 * S + 0.2 * E + 0.1 * A;
  const total = Math.round(clamp01(weighted) * 100);

  return {
    ideaAlignment: Math.round(I * 100),
    skillsFit: Math.round(S * 100),
    eloCompatibility: Math.round(E * 100),
    activity: Math.round(A * 100),
    total,
  };
}

module.exports = {
  computeMatchScore,
  matchPairKey,
  jaccard,
};
