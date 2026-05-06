require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Trust Render / reverse proxy so secure cookies work over HTTPS
app.set('trust proxy', 1);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
];
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

const io = new Server(httpServer, {
  cors: {
    origin: corsAllowed,
    credentials: true,
  },
});

app.use(express.json());

const UPLOADS_ROOT = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_ROOT)) fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
app.use('/uploads', express.static(UPLOADS_ROOT));

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
};
if (process.env.MONGODB_URI) {
  sessionOptions.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
} else {
  console.warn('MONGODB_URI not set — sessions use default MemoryStore (dev only).');
}
app.use(session(sessionOptions));

const connectDB = require('./config/db');
connectDB();

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

// ─── Socket.IO (match chat) ───────────────────────────────────────────────────
const { Message } = require('./models/Message');
const Match = require('./models/Match');

io.on('connection', (socket) => {
  socket.on('join-room', async (matchId, callback) => {
    await socket.join(matchId);

    let history = [];
    try {
      history = await Message.find({ matchId })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();
    } catch (_) {
      /* ignore */
    }

    if (callback) callback({ status: 'ok', history });
  });

  socket.on(
    'send-message',
    async ({ matchId, senderId, senderInitials, senderColor, content }, callback) => {
      const now = new Date();

      try {
        await Message.create({ matchId, senderId, senderInitials, senderColor, content });
        await Match.findByIdAndUpdate(matchId, { lastMessageAt: new Date() }).catch(() => {});
      } catch (_) {
        /* ignore */
      }

      socket.to(matchId).emit('chat-message', {
        id: Date.now(),
        senderId,
        senderInitials,
        senderColor,
        content,
        time: now,
      });

      if (callback) callback({ status: 'ok' });
    }
  );

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
