const path = require('path');
const fs = require('fs');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  override: true,
});
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Trust Render's proxy so secure cookies work over HTTPS
app.set('trust proxy', 1);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
const corsAllowed = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultDevOrigins;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || corsAllowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

const UPLOADS_ROOT = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
app.use('/uploads', express.static(UPLOADS_ROOT));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

const connectDB = require('./config/db');
connectDB().then(async () => {
  const { ensureEloSchema } = require('./lib/elo');
  const User = require('./models/User');
  User.distinct('_id').then((ids) => ensureEloSchema(ids)).catch(() => {});

  // Seed starter ideas so users can swipe and match without needing to post ideas first
  const Idea = require('./models/Idea');
  const mongoose = require('mongoose');
  const SYSTEM_FOUNDER = new mongoose.Types.ObjectId('000000000000000000000001');
  const count = await Idea.countDocuments({ founder: SYSTEM_FOUNDER });
  if (count === 0) {
    const seeds = [
      { title: 'AI meeting notes that actually ship actions', description: 'Listens to standups, auto-creates tasks in Linear, and pings ghosting teammates.', tags: ['AI', 'B2B'] },
      { title: 'Stripe for creator payouts', description: 'One API to split revenue between creators, platforms, and collaborators. No spreadsheet hell.', tags: ['Fintech', 'API'] },
      { title: 'Cursor but for design', description: 'AI pair designer in Figma. Suggests components, catches inconsistencies, writes design tokens.', tags: ['Design', 'AI'] },
      { title: 'YC application co-pilot', description: 'Trained on every funded YC application. Tells you exactly what to fix before you submit.', tags: ['AI', 'Founders'] },
      { title: 'Ramp for college students', description: 'Corporate card and spend tracking built for student orgs and hackathon clubs. Auto-reconciles reimbursements.', tags: ['Fintech', 'EdTech'] },
      { title: 'Background check for freelancers', description: 'Instant trust score for contractors — GitHub activity, past client reviews, on-time delivery rate.', tags: ['B2B', 'Marketplace'] },
      { title: 'Vercel for mobile apps', description: 'Push to deploy React Native. Preview links for every PR. No Xcode, no TestFlight drama.', tags: ['DevTools', 'Mobile'] },
      { title: 'OpenTable but for study rooms', description: 'Book library pods, café corners, and campus quiet zones in one app. Waitlist notifications when a spot opens.', tags: ['EdTech', 'Consumer'] },
      { title: 'Duolingo for system design', description: 'Daily bite-sized system design challenges with spaced repetition. Built for new grads prepping for FAANG.', tags: ['EdTech', 'AI'] },
      { title: 'Equity calculator for early hires', description: 'Enter your offer, the company stage, and dilution assumptions — get a plain-English breakdown of what your options are actually worth.', tags: ['Fintech', 'Founders'] },
    ];
    await Idea.insertMany(seeds.map((s) => ({ ...s, founder: SYSTEM_FOUNDER, status: 'open', eloScore: 80 })));
    console.log('[seed] inserted', seeds.length, 'starter ideas');
  }
});

const passport = require('passport');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/uploads', require('./routes/uploads').router);
app.use('/api/projects', require('./routes/projects'));
app.use('/api/swipe', require('./routes/swipe'));
app.use('/api/build', require('./routes/build'));
app.use('/api/survey', require('./routes/survey'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const { Message } = require('./models/Message');
const Match = require('./models/Match');

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('join-room', async (matchId, callback) => {
    const match = await Match.findById(matchId).select('_id').lean().catch(() => null);
    if (!match) {
      if (callback) callback({ status: 'locked', error: 'Chat only starts after a founder match exists.' });
      return;
    }

    await socket.join(matchId);
    console.log(`socket ${socket.id} joined room ${matchId}`);

    let history = [];
    try {
      history = await Message.find({ matchId })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();
    } catch (_) {}

    if (callback) callback({ status: 'ok', history });
  });

  socket.on('send-message', async ({ matchId, senderId, senderInitials, senderColor, content }, callback) => {
    const match = await Match.findById(matchId).select('_id').lean().catch(() => null);
    if (!match) {
      if (callback) callback({ status: 'locked', error: 'Chat only starts after a founder match exists.' });
      return;
    }

    const now = new Date();

    try {
      await Message.create({ matchId, senderId, senderInitials, senderColor, content });
      await Match.findByIdAndUpdate(matchId, { lastMessageAt: now }).catch(() => {});
    } catch (_) {}

    socket.to(matchId).emit('chat-message', {
      id: Date.now(),
      senderId,
      senderInitials,
      senderColor,
      content,
      time: now,
    });

    if (callback) callback({ status: 'ok' });
  });

  socket.on('disconnect', () => {});
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
