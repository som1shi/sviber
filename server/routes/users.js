const express = require('express');
const router = express.Router();

// TODO: implement
router.get('/:id', async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.put('/:id', async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;
