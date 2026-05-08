const mongoose = require('mongoose');

const ideaCommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

const ideaSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  isAiGenerated: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, required: true },
  // Community post metadata for a project share
  caption: { type: String, default: '' },
  notes: { type: String, default: '' },
  feedbackRequest: { type: String, default: '' },
  topic: { type: String, default: '' },
  tags: [{ type: String }],
  projectUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageUpload: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  builderCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  comments: [ideaCommentSchema],
  eloScore: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'building', 'launched'], default: 'open' },
}, { timestamps: true });

ideaSchema.index({ founder: 1, status: 1, eloScore: -1 });

module.exports = mongoose.model('Idea', ideaSchema);
