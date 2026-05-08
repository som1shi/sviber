const Survey = require('../models/Survey');

const HOURS_OPTIONS    = ['< 20 hrs', '20–40 hrs', '40–60 hrs', '60+ hrs'];
const AMBITION_OPTIONS = ['Lifestyle business', 'Solid acquisition ($1–10M)', 'Big exit ($10–100M)', 'Go big or go home (IPO)'];
const FUNDING_OPTIONS  = ['Bootstrap it', 'Pre-seed (~$500K)', 'Seed (~$2M)', 'As much as we can'];
const RUNWAY_OPTIONS   = ['0–3 months', '3–6 months', '6–12 months', '12+ months'];

function ordinalScore(options, valA, valB) {
  const iA = options.indexOf(valA);
  const iB = options.indexOf(valB);
  if (iA === -1 || iB === -1) return 50;
  return Math.max(0, 100 - Math.abs(iA - iB) * 33);
}

function skillsComplementarity(mapA, mapB) {
  if (!mapA || !mapB) return 50;
  const fields = ['Engineering', 'Product', 'Design', 'Sales', 'Marketing'];
  const scores = fields.map((f) => {
    const a = typeof mapA.get === 'function' ? mapA.get(f) : mapA[f];
    const b = typeof mapB.get === 'function' ? mapB.get(f) : mapB[f];
    if (a == null || b == null) return 50;
    return Math.round((Math.abs(a - b) / 9) * 100);
  });
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

// Keyword overlap between two text fields — aligned values score higher
function keywordOverlap(textA, textB) {
  if (!textA || !textB) return 50;
  const tokenize = (s) => new Set(s.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const a = tokenize(textA);
  const b = tokenize(textB);
  const intersection = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 50 : Math.round((intersection / union) * 100);
}

function computeCulturefit(surveyA, surveyB) {
  if (!surveyA || !surveyB) return 50;
  const cultureScore  = keywordOverlap(surveyA.culture,  surveyB.culture);
  const conflictScore = keywordOverlap(surveyA.conflict, surveyB.conflict);
  return Math.round((cultureScore + conflictScore) / 2);
}

function structuredScore(surveyA, surveyB, userA, userB) {
  const skills        = skillsComplementarity(surveyA?.skills, surveyB?.skills);
  const hoursScore    = ordinalScore(HOURS_OPTIONS,    surveyA?.hours,    surveyB?.hours);
  const runwayScore   = ordinalScore(RUNWAY_OPTIONS,   surveyA?.runway,   surveyB?.runway);
  const ambitionScore = ordinalScore(AMBITION_OPTIONS, surveyA?.ambition, surveyB?.ambition);
  const fundingScore  = ordinalScore(FUNDING_OPTIONS,  surveyA?.funding,  surveyB?.funding);

  const commitment      = Math.round((hoursScore + runwayScore) / 2);
  const vision          = Math.round((ambitionScore + fundingScore) / 2);
  const culturefit      = computeCulturefit(surveyA, surveyB);

  const eloA = userA.elo?.total ?? 1000;
  const eloB = userB.elo?.total ?? 1000;
  const eloCompatibility = Math.round(Math.max(0, 100 - Math.abs(eloA - eloB) / 10));

  // ideaAlignment 10 + skills 20 + vision 20 + commitment 15 + elo 10 + culture 25 = 100
  const total = Math.round(
    100            * 0.10 +
    skills         * 0.20 +
    vision         * 0.20 +
    commitment     * 0.15 +
    eloCompatibility * 0.10 +
    culturefit     * 0.25,
  );

  return {
    ideaAlignment:         100,
    skillsComplementarity: skills,
    visionAlignment:       vision,
    commitmentAlignment:   commitment,
    eloCompatibility,
    culturefit,
    total,
  };
}

module.exports = { structuredScore };
