const mongoose = require('mongoose');

// TODO: define schema
const matchSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
