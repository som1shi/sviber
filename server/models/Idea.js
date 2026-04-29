const mongoose = require('mongoose');

// TODO: define schema
const ideaSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);
