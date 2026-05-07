const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  // Community post metadata for a project share
  caption: { type: String, default: '' },
  notes: { type: String, default: '' },
  feedbackRequest: { type: String, default: '' },
  tags: [{ type: String }],
  projectUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageUpload: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  builderCount: { type: Number, default: 0 },
  eloScore: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'building', 'launched'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);
