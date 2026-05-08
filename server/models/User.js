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

const ROLE_ENUM = ['FE', 'BE', 'AI', 'DESIGN', 'GTM', 'PM'];

const userSchema = new mongoose.Schema(
  {
    googleId:    { type: String, required: true, unique: true },
    name:        { type: String, required: true },
    email:       { type: String },
    profilePic:  { type: String },
    title:       { type: String, default: 'Builder' },
    school:      { type: String, default: '' },
    bio:         { type: String, default: '' },
    githubLink:  { type: String, default: '' },
    primaryRole: { type: String, enum: ROLE_ENUM, default: 'PM' },
    skills:      [{ type: String }],
    lastActiveAt:{ type: Date, default: Date.now },
    lastSwipeAt: { type: Date },
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
      history: [{
        total:    { type: Number },
        date:     { type: Date, default: Date.now },
        event:    { type: String },
        _id:      false,
      }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
