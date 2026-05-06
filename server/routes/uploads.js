const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const Upload = require('../models/Upload');
const ALLOWED_KINDS = Upload.KIND_ENUM;
const Match = require('../models/Match');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = String(req.user._id);
    const dir = path.join(UPLOAD_ROOT, userId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 16).toLowerCase();
    const safe = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext || ''}`;
    cb(null, safe);
  },
});

const uploadMw = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function uploadSingle(req, res, next) {
  uploadMw.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 8MB)' });
    }
    return res.status(400).json({ error: err.message || 'Upload failed' });
  });
}

function validateMime(kind, mime) {
  const isImage = /^image\//.test(mime);
  const isPdf = mime === 'application/pdf';
  if (kind === 'chat') return isImage || isPdf;
  return isImage;
}

/**
 * POST multipart/form-data: file (required), kind (required).
 * Optional: match (Match id), idea (Idea id). Use query ?kind=profile if your client
 * sends the file before other fields (multer body ordering).
 */
router.post('/', ensureAuthenticated, uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file (field name: file)' });

    const kind = req.query.kind || req.body.kind;

    const unlink = () => {
      fs.unlink(req.file.path, () => {});
    };

    if (!kind || !ALLOWED_KINDS.includes(kind)) {
      unlink();
      return res.status(400).json({ error: `kind must be one of: ${ALLOWED_KINDS.join(', ')}` });
    }

    if (!validateMime(kind, req.file.mimetype)) {
      unlink();
      return res.status(400).json({ error: 'Unsupported file type for this kind' });
    }

    const matchId = req.body.match || req.body.matchId;
    const ideaId = req.body.idea || req.body.ideaId;

    if (kind === 'match_asset' || kind === 'chat') {
      if (!matchId) {
        unlink();
        return res.status(400).json({ error: 'match id is required for this kind' });
      }
      const match = await Match.findOne({ _id: matchId, users: req.user._id });
      if (!match) {
        unlink();
        return res.status(403).json({ error: 'Not a participant in this match' });
      }
    }

    const userId = String(req.user._id);
    const relativePath = [userId, req.file.filename].join('/');

    const doc = await Upload.create({
      user: req.user._id,
      match: matchId || undefined,
      idea: ideaId || undefined,
      kind,
      relativePath,
      originalFilename: req.file.originalname || '',
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const payload = doc.toObject();
    payload.url = `/uploads/${relativePath}`;
    res.status(201).json(payload);
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate upload path' });
    }
    res.status(400).json({ error: err.message || 'Upload failed' });
  }
});

router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const doc = await Upload.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (String(doc.user) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const absPath = path.join(UPLOAD_ROOT, ...doc.relativePath.split('/'));
    await Upload.findByIdAndDelete(doc._id);
    fs.unlink(absPath, () => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, UPLOAD_ROOT };
