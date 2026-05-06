const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  /** Stable id for idea + sorted user pair; unique to prevent duplicates. */
  pairKey: { type: String, required: true, unique: true, index: true },
  users: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: { validator: (v) => v.length === 2, message: 'Match must have exactly 2 users' },
  },
  score: {
    ideaAlignment: { type: Number, default: 0 },
    skillsFit: { type: Number, default: 0 },
    eloCompatibility: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['pending', 'collab', 'passed'], default: 'pending' },
  /** First time both sides choose collab (set from PATCH /status). */
  collabStartedAt: { type: Date },
  /** Denormalized for listing/sorting; updated when chat messages are stored. */
  lastMessageAt: { type: Date },
}, { timestamps: true });

matchSchema.index({ users: 1, status: 1 });
matchSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
