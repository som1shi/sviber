const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills:     { type: Map, of: Number },
    hours:      { type: String },
    strengths:  { type: String },
    weaknesses: { type: String },
    whynow:     { type: String },
    ambition:   { type: String },
    funding:    { type: String },
    runway:     { type: String },
    culture:    { type: String },
    conflict:   { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Survey', surveySchema);
