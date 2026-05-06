const mongoose = require('mongoose');

const eloStatsSchema = new mongoose.Schema({
  projectsLaunched:  { type: Number, default: 0 },
  projectsAbandoned: { type: Number, default: 0 },
  matchesCollab:     { type: Number, default: 0 },
  matchesPassed:     { type: Number, default: 0 },
  totalSwipes:       { type: Number, default: 0 },
  rightSwipes:       { type: Number, default: 0 },
  peerRatingSum:     { type: Number, default: 0 },
  peerRatingCount:   { type: Number, default: 0 },
  ideaNetVotes:      { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    googleId:    { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email:       { type: String },
    avatar:      { type: String },
    role:        { type: String, default: 'Builder' },
    school:      { type: String, default: '' },
    bio:         { type: String, default: '' },
    github:      { type: String, default: '' },
    elo: {
      total:        { type: Number, default: 1000 },
      breakdown: {
        reliability: { type: Number, default: 50 },
        quality:     { type: Number, default: 50 },
        activity:    { type: Number, default: 50 },
      },
      stats:        { type: eloStatsSchema, default: () => ({}) },
      startingBonus:{ type: Number, default: 0 },
      lastActive:   { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
