const mongoose = require('mongoose');

const swipeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  direction: { type: String, enum: ['right', 'left', 'up'], required: true },
}, { timestamps: true });

swipeSchema.index({ user: 1, idea: 1 }, { unique: true });
swipeSchema.index({ idea: 1, direction: 1 });

module.exports = mongoose.model('Swipe', swipeSchema);
