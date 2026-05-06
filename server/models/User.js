const mongoose = require('mongoose');

const eloHistorySchema = new mongoose.Schema({
  delta: { type: Number, required: true },
  reason: { type: String, required: true },
  at: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  profilePic: { type: String },
  title: { type: String },
  school: { type: String },
  bio: { type: String },
  githubLink: { type: String },
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
