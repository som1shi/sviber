const mongoose = require('mongoose');

// TODO: define schema
const userSchema = new mongoose.Schema({}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
