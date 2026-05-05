require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// TODO: uncomment to enable sessions (required before Google OAuth)
// const session = require('express-session');
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'dev-secret',
//   resave: false,
//   saveUninitialized: false,
// }));

const connectDB = require('./config/db');
connectDB();

// TODO: uncomment to enable Google OAuth
// const passport = require('passport');
// require('./config/passport');
// app.use(passport.initialize());
// app.use(passport.session());

app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/swipe', require('./routes/swipe'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
// Each match gets its own room keyed by matchId.
// Events: join-room, send-message → broadcasts chat-message to the room.

const { Message } = require('./models/Message');

io.on('connection', (socket) => {
  socket.on('join-room', async (matchId, callback) => {
    await socket.join(matchId);

    // Send last 50 messages so the user sees history on load
    const history = await Message.find({ matchId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    if (callback) callback({ status: 'ok', history });
  });

  socket.on('send-message', async ({ matchId, senderId, senderInitials, senderColor, content }, callback) => {
    const msg = await Message.create({ matchId, senderId, senderInitials, senderColor, content });

    io.to(matchId).emit('chat-message', {
      id: msg._id,
      senderId,
      senderInitials,
      senderColor,
      content,
      time: msg.createdAt,
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
