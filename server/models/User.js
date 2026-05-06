const mongoose = require('mongoose');

const eloHistorySchema = new mongoose.Schema({
  delta: { type: Number, required: true },
  reason: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const ROLE_ENUM = ['FE', 'BE', 'AI', 'DESIGN', 'GTM', 'PM'];

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  profilePic: { type: String },
  title: { type: String },
  school: { type: String },
  bio: { type: String },
  githubLink: { type: String },
  /** Primary builder role — drives skills-complement scoring in cofounder matching. */
  primaryRole: { type: String, enum: ROLE_ENUM, default: 'PM' },
  /** Client / server bumps this on swipe and other actions for “active lately”. */
  lastActiveAt: { type: Date, default: Date.now },
  /** Last swipe time (set server-side); preferred for matching activity signal. */
  lastSwipeAt: { type: Date },
  skills: [{ type: String }],
  elo: {
    total: { type: Number, default: 0 },
    breakdown: {
      ideaQuality: { type: Number, default: 0 },
      buildRate: { type: Number, default: 0 },
      collaboration: { type: Number, default: 0 },
    },
    history: [eloHistorySchema],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
