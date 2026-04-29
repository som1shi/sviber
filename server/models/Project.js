const mongoose = require('mongoose');

// TODO: define schema
const projectSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
