require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Trust Render's proxy so secure cookies work over HTTPS
app.set('trust proxy', 1);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5175', credentials: true }));
app.use(express.json());

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
connectDB().then(() => autoSeed(15)).catch(() => {});

const passport = require('passport');
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/swipe', require('./routes/swipe'));
app.use('/api/build', require('./routes/build'));
app.use('/api/survey', require('./routes/survey'));
const { router: generateIdeasRouter, autoSeed } = require('./routes/generateIdeas');
app.use('/api/generate-ideas', generateIdeasRouter);

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

    console.log(`message from ${socket.id} in room ${matchId}:`, content);
    const now = new Date();

    try {
      await Message.create({ matchId, senderId, senderInitials, senderColor, content });
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
