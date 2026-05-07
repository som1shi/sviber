const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Idea = require('../models/Idea');

const CATEGORIES = [
  'AI tools for developers', 'fintech for Gen Z', 'edtech and learning',
  'creator economy', 'B2B SaaS', 'climate tech', 'health and wellness',
  'marketplace ideas', 'consumer social', 'devtools and infrastructure',
];

const TAGS_MAP = {
  'AI tools for developers': ['AI', 'DevTools'],
  'fintech for Gen Z': ['Fintech', 'Consumer'],
  'edtech and learning': ['EdTech', 'AI'],
  'creator economy': ['Creator', 'Consumer'],
  'B2B SaaS': ['B2B', 'SaaS'],
  'climate tech': ['Climate', 'B2B'],
  'health and wellness': ['Health', 'Consumer'],
  'marketplace ideas': ['Marketplace', 'B2B'],
  'consumer social': ['Social', 'Consumer'],
  'devtools and infrastructure': ['DevTools', 'API'],
};

const SEED_IDEAS = [
  { title: 'AI meeting notes that actually ship actions', description: 'Listens to standups, auto-creates tasks in Linear, and pings ghosting teammates.', tags: ['AI', 'DevTools'], heat: 94 },
  { title: 'Stripe for creator payouts', description: 'One API to split revenue between creators, platforms, and collaborators. No spreadsheet hell.', tags: ['Fintech', 'Consumer'], heat: 87 },
  { title: 'Cursor but for design', description: 'AI pair designer in Figma. Suggests components, catches inconsistencies, writes design tokens.', tags: ['AI', 'DevTools'], heat: 91 },
  { title: 'YC application co-pilot', description: 'Trained on every funded YC application. Tells you exactly what to fix before you submit.', tags: ['AI', 'DevTools'], heat: 96 },
  { title: 'Ramp for college students', description: 'Corporate card and spend tracking built for student orgs and hackathon clubs. Auto-reconciles reimbursements.', tags: ['Fintech', 'Consumer'], heat: 78 },
  { title: 'Background check for freelancers', description: 'Instant trust score for contractors — GitHub activity, past client reviews, on-time delivery rate.', tags: ['B2B', 'SaaS'], heat: 82 },
  { title: 'Vercel for mobile apps', description: 'Push to deploy React Native. Preview links for every PR. No Xcode, no TestFlight drama.', tags: ['DevTools', 'API'], heat: 89 },
  { title: 'OpenTable but for study rooms', description: 'Book library pods, café corners, and campus quiet zones in one app. Waitlist notifications when a spot opens.', tags: ['EdTech', 'AI'], heat: 71 },
  { title: 'Duolingo for system design', description: 'Daily bite-sized system design challenges with spaced repetition. Built for new grads prepping for FAANG.', tags: ['EdTech', 'AI'], heat: 85 },
  { title: 'Equity calculator for early hires', description: 'Enter your offer and dilution assumptions — get a plain-English breakdown of what your options are worth.', tags: ['Fintech', 'Consumer'], heat: 88 },
  { title: 'On-demand TA for coding bootcamps', description: 'AI tutor that unblocks students in under 2 minutes. Escalates to a human when it cannot solve it.', tags: ['EdTech', 'AI'], heat: 80 },
  { title: 'Loom but async and structured', description: 'Record walkthroughs with automatic chapters, action item extraction, and searchable transcripts.', tags: ['B2B', 'SaaS'], heat: 83 },
  { title: 'Linear for solopreneurs', description: 'Issue tracker that does not require a team. Syncs with your calendar, GitHub, and Notion automatically.', tags: ['B2B', 'SaaS'], heat: 76 },
  { title: 'Carbon footprint API for e-commerce', description: 'One line of code adds real-time emissions data to any checkout. Brands pay per transaction.', tags: ['Climate', 'B2B'], heat: 79 },
  { title: 'Plaid but for crypto wallets', description: 'Unified API to read balances, transactions, and DeFi positions across every chain. Built for fintech apps.', tags: ['Fintech', 'Consumer'], heat: 84 },
  { title: 'Figma for pitch decks', description: 'AI-assisted slide builder trained on winning YC and a16z decks. Tells you when your deck is off-market.', tags: ['AI', 'DevTools'], heat: 90 },
  { title: 'Glassdoor for startup equity', description: 'Anonymous database of real startup offer letters. Know if your equity is actually competitive before signing.', tags: ['Fintech', 'Consumer'], heat: 86 },
  { title: 'Shopify for local service businesses', description: 'Instant booking, payments, and reviews in one link. Built for tutors, cleaners, and dog walkers.', tags: ['Marketplace', 'B2B'], heat: 77 },
  { title: 'AI code reviewer that ships fixes', description: 'Reviews your PR, explains issues in plain English, and opens a follow-up PR with the fix automatically.', tags: ['AI', 'DevTools'], heat: 93 },
  { title: 'Mental health tracker for founders', description: 'Daily mood check-ins correlated with business metrics. Flags burnout before it hits.', tags: ['Health', 'Consumer'], heat: 72 },
  { title: 'Notion AI for legal docs', description: 'Paste any contract and get plain-English summaries, red flags, and negotiation suggestions instantly.', tags: ['B2B', 'SaaS'], heat: 88 },
  { title: 'Discord for alumni networks', description: 'Private community platform built for university alumni. Job board, mentorship matching, and event management included.', tags: ['Social', 'Consumer'], heat: 74 },
  { title: 'Zapier for physical devices', description: 'Connect IoT sensors, smart home devices, and industrial equipment with a no-code automation builder.', tags: ['B2B', 'SaaS'], heat: 81 },
  { title: 'Substack for podcasters', description: 'Paid podcast subscriptions with automatic transcripts, chapter markers, and episode newsletters baked in.', tags: ['Creator', 'Consumer'], heat: 83 },
  { title: 'TurboTax for crypto taxes', description: 'Pulls all your on-chain transactions automatically and generates a CPA-ready tax report in minutes.', tags: ['Fintech', 'Consumer'], heat: 91 },
  { title: 'GitHub Copilot for data analysts', description: 'AI that writes SQL, Python, and dbt models from plain English. Understands your schema automatically.', tags: ['AI', 'DevTools'], heat: 89 },
  { title: 'Intern marketplace for startups', description: 'Vetted student interns on two-week trials. Startups pay only if they extend. No recruiter fees.', tags: ['Marketplace', 'B2B'], heat: 76 },
  { title: 'Sleep coaching app backed by wearables', description: 'Reads your Oura or Whoop data and gives you a personalized 4-week sleep improvement plan.', tags: ['Health', 'Consumer'], heat: 78 },
  { title: 'API observability for non-engineers', description: 'Dashboard that shows API health, latency, and errors in plain English. Alerts go to Slack, not PagerDuty.', tags: ['DevTools', 'API'], heat: 82 },
  { title: 'Co-living matching for remote workers', description: 'Match remote workers by timezone, work style, and budget into shared apartments. Leases handled by the platform.', tags: ['Marketplace', 'B2B'], heat: 75 },
  { title: 'AI nutritionist that reads your groceries', description: 'Scan your fridge and pantry — get a weekly meal plan built around what you already have.', tags: ['Health', 'Consumer'], heat: 80 },
  { title: 'Headhunter for open-source contributors', description: 'Companies post bounties for open-source work. Contributors get paid and get hired from their commits.', tags: ['Marketplace', 'B2B'], heat: 85 },
  { title: 'Climate pledge tracker for SMBs', description: 'Small businesses set carbon goals, track progress, and get a verified badge for their website and checkout.', tags: ['Climate', 'B2B'], heat: 73 },
  { title: 'PR agency in a box for startups', description: 'AI drafts press releases, finds the right journalists, and tracks coverage — all for less than one freelancer.', tags: ['AI', 'DevTools'], heat: 81 },
  { title: 'Micro-SaaS idea validator', description: 'Enter an idea and get back SEO demand data, competitor analysis, and a go/no-go score in 30 seconds.', tags: ['B2B', 'SaaS'], heat: 87 },
  { title: 'Blind but for startup employees', description: 'Anonymous forum for startup workers to share comp, equity horror stories, and founder red flags.', tags: ['Social', 'Consumer'], heat: 79 },
  { title: 'E-commerce returns automation', description: 'AI that processes returns, issues store credit, and restocks inventory without a human touching it.', tags: ['B2B', 'SaaS'], heat: 84 },
  { title: 'Fantasy sports but for startups', description: 'Pick a portfolio of seed-stage startups. Score points when they raise, launch, or get acquired.', tags: ['Social', 'Consumer'], heat: 77 },
  { title: 'Video interview coach powered by AI', description: 'Practice with a realistic interviewer, get scored on filler words, pacing, and answer structure.', tags: ['AI', 'DevTools'], heat: 86 },
  { title: 'Invoice factoring for freelancers', description: 'Get paid instantly on net-60 invoices. Platform collects from clients and takes a small fee.', tags: ['Fintech', 'Consumer'], heat: 83 },
];

async function generateBatch(count = 10) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const tags = TAGS_MAP[category];

  const prompt = `Generate ${count} unique, specific, and compelling startup ideas in the category: "${category}".

For each idea return a JSON object with:
- title: short punchy name (max 8 words)
- description: 1-2 sentence pitch that explains the problem and solution (max 40 words)
- tags: array of 2 tags from this list: ${JSON.stringify(tags)}
- heat: integer 60-99 representing market excitement

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"title":"...","description":"...","tags":["..."],"heat":85}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in response');

  return JSON.parse(jsonMatch[0]);
}

// POST /api/generate-ideas — generate and save a batch via Gemini
router.post('/', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }
  try {
    const count = Math.min(Number(req.query.count) || 10, 20);
    const ideas = await generateBatch(count);

    const saved = await Idea.insertMany(
      ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        eloScore: idea.heat || 75,
        isAiGenerated: true,
      }))
    );

    res.json({ generated: saved.length, ideas: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seeding on startup uses hardcoded ideas — no API calls, no rate limits
async function autoSeed(minCount = 50) {
  try {
    const existing = await Idea.find({}, 'title').lean();
    const existingTitles = new Set(existing.map((i) => i.title));
    const toInsert = SEED_IDEAS.filter((i) => !existingTitles.has(i.title));
    if (toInsert.length === 0) return;

    await Idea.insertMany(
      toInsert.map((idea) => ({
        title: idea.title,
        description: idea.description,
        tags: idea.tags || [],
        eloScore: idea.heat || 75,
        isAiGenerated: true,
      }))
    );
    console.log(`Seeded ${toInsert.length} new ideas.`);
  } catch (err) {
    console.error('autoSeed failed:', err.message);
  }
}

module.exports = { router, autoSeed };
