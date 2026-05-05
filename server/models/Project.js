const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  name: { type: String, required: true },
  description: { type: String },
  contributors: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String },
    joinedAt: { type: Date, default: Date.now },
  }],
  status: { type: String, enum: ['active', 'paused', 'completed', 'abandoned'], default: 'active' },
  tasks: [taskSchema],
  githubRepo: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
