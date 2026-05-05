const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId:    { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email:       { type: String },
    avatar:      { type: String },
    role:        { type: String, default: 'Builder' },
    school:      { type: String, default: '' },
    bio:         { type: String, default: '' },
    github:      { type: String, default: '' },
    elo:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
