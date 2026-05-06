const Anthropic = require('@anthropic-ai/sdk');
const Survey = require('../models/Survey');
const Match = require('../models/Match');

const anthropic = new Anthropic();

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
    // Survey stores skills as a Mongoose Map; handle both Map and plain object
    const a = typeof mapA.get === 'function' ? mapA.get(f) : mapA[f];
    const b = typeof mapB.get === 'function' ? mapB.get(f) : mapB[f];
    if (a == null || b == null) return 50;
    return Math.round((Math.abs(a - b) / 9) * 100);
  });
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

// Compute all survey-based scores synchronously (no network calls)
function structuredScore(surveyA, surveyB, userA, userB) {
  const skills       = skillsComplementarity(surveyA?.skills, surveyB?.skills);
  const hoursScore   = ordinalScore(HOURS_OPTIONS,    surveyA?.hours,    surveyB?.hours);
  const runwayScore  = ordinalScore(RUNWAY_OPTIONS,   surveyA?.runway,   surveyB?.runway);
  const ambitionScore= ordinalScore(AMBITION_OPTIONS, surveyA?.ambition, surveyB?.ambition);
  const fundingScore = ordinalScore(FUNDING_OPTIONS,  surveyA?.funding,  surveyB?.funding);

  const commitment = Math.round((hoursScore + runwayScore) / 2);
  const vision     = Math.round((ambitionScore + fundingScore) / 2);

  const eloA = userA.elo?.total ?? 1000;
  const eloB = userB.elo?.total ?? 1000;
  const eloCompatibility = Math.round(Math.max(0, 100 - Math.abs(eloA - eloB) / 10));

  // Weights without culturefit (gets recomputed when Claude returns)
  // ideaAlignment 15 + skills 25 + vision 25 + commitment 20 + elo 15 = 100
  const total = Math.round(
    100          * 0.15 +
    skills       * 0.25 +
    vision       * 0.25 +
    commitment   * 0.20 +
    eloCompatibility * 0.15,
  );

  return {
    ideaAlignment:         100,
    skillsComplementarity: skills,
    visionAlignment:       vision,
    commitmentAlignment:   commitment,
    eloCompatibility,
    culturefit:            null,
    total,
  };
}

// Called async after match creation — fetches text answers, asks Claude, updates match
async function computeAndStoreCulturefit(matchId, userIdA, userIdB) {
  try {
    const [surveyA, surveyB] = await Promise.all([
      Survey.findOne({ userId: userIdA }).lean(),
      Survey.findOne({ userId: userIdB }).lean(),
    ]);

    const textFields = ['strengths', 'weaknesses', 'culture', 'conflict'];
    const hasText = textFields.some((f) => surveyA?.[f] && surveyB?.[f]);
    if (!hasText) {
      await Match.findByIdAndUpdate(matchId, { scorePending: false });
      return;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{
        role: 'user',
        content: `Score co-founder culture compatibility 0–100. Return ONLY valid JSON: {"score": <integer 0-100>}

Person A — Strengths: ${surveyA.strengths || 'N/A'} | Weaknesses: ${surveyA.weaknesses || 'N/A'} | Culture: ${surveyA.culture || 'N/A'} | Conflict: ${surveyA.conflict || 'N/A'}
Person B — Strengths: ${surveyB.strengths || 'N/A'} | Weaknesses: ${surveyB.weaknesses || 'N/A'} | Culture: ${surveyB.culture || 'N/A'} | Conflict: ${surveyB.conflict || 'N/A'}

High score = complementary strengths/weaknesses, aligned culture values, compatible conflict resolution styles.`,
      }],
    });

    const { score } = JSON.parse(message.content[0].text);
    const culturefit = Math.max(0, Math.min(100, Math.round(score)));

    const match = await Match.findById(matchId);
    if (!match) return;

    const { skillsComplementarity: sc, visionAlignment, commitmentAlignment, eloCompatibility } = match.score;

    // Recompute total with culturefit: redistribute weights to include it
    // ideaAlignment 10 + skills 20 + vision 20 + commitment 15 + elo 10 + culture 25 = 100
    const newTotal = Math.round(
      100          * 0.10 +
      sc           * 0.20 +
      visionAlignment  * 0.20 +
      commitmentAlignment * 0.15 +
      eloCompatibility * 0.10 +
      culturefit   * 0.25,
    );

    await Match.findByIdAndUpdate(matchId, {
      'score.culturefit': culturefit,
      'score.total': newTotal,
      scorePending: false,
    });
  } catch (_) {
    await Match.findByIdAndUpdate(matchId, { scorePending: false }).catch(() => {});
  }
}

module.exports = { structuredScore, computeAndStoreCulturefit };
