const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    matchId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderInitials: { type: String, required: true },
    senderColor: { type: String, default: '#7C5CFC' },
    content: { type: String, required: true },
    /** Optional attachment (image/PDF) uploaded via POST /api/uploads kind=chat */
    upload: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
module.exports = { Message };
