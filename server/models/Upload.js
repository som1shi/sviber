const mongoose = require('mongoose');

/**
 * Metadata for files stored on disk under `server/uploads/<userId>/…`.
 * Public URL: GET /uploads/<relativePath>
 */
const KIND_ENUM = ['profile', 'match_asset', 'chat', 'idea'];

const uploadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', index: true },
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea' },
    kind: { type: String, enum: KIND_ENUM, required: true, index: true },
    /** Relative path using `/` (e.g. `507f1f77bcf86cd799439011/1730000-abc.png`) */
    relativePath: { type: String, required: true, unique: true },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

uploadSchema.index({ user: 1, createdAt: -1 });
uploadSchema.index({ match: 1, createdAt: -1 });

module.exports = mongoose.model('Upload', uploadSchema);
module.exports.KIND_ENUM = KIND_ENUM;
