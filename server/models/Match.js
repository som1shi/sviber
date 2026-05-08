const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  users: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    validate: { validator: (v) => v.length === 2, message: 'Match must have exactly 2 users' },
  },
  score: {
    ideaAlignment: { type: Number, default: 0 },
    skillsFit: { type: Number, default: 0 },
    ambitionScore: { type: Number, default: 0 },
    commitmentScore: { type: Number, default: 0 },
    eloCompatibility: { type: Number, default: 0 },
    activity: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['pending', 'collab', 'passed'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
