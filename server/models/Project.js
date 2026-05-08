const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
}, { timestamps: true });

const planningSchema = new mongoose.Schema({
  problem: { type: String, default: '' },
  targetUser: { type: String, default: '' },
  mvpScope: { type: String, default: '' },
  successMetric: { type: String, default: '' },
  launchGoal: { type: String, default: '' },
  risks: { type: String, default: '' },
  checklistDone: [{ type: String }],
}, { _id: false });

const projectSchema = new mongoose.Schema({
  // Draft projects may not yet be published to Community / matched to a co-founder.
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea' },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  name: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  projectUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageUpload: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  contributors: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String },
    joinedAt: { type: Date, default: Date.now },
  }],
  publishedToCommunity: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'paused', 'completed', 'abandoned'], default: 'active' },
  tasks: [taskSchema],
  githubRepo: { type: String },
  ratings: [{
    from:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, min: 1, max: 5, required: true },
  }],
  planning: { type: planningSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
