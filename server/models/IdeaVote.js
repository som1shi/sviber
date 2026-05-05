const mongoose = require('mongoose');

const ideaVoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  value: { type: Number, enum: [1, -1], required: true },
}, { timestamps: true });

ideaVoteSchema.index({ user: 1, idea: 1 }, { unique: true });

module.exports = mongoose.model('IdeaVote', ideaVoteSchema);
