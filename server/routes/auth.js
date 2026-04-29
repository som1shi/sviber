const express = require('express');
const router = express.Router();

// TODO: uncomment once Passport + sessions are wired up in index.js
// const passport = require('passport');
// const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

router.get('/google', (req, res) => {
  // TODO: passport.authenticate('google', { scope: ['profile', 'email'] })
  res.status(501).json({ message: 'Google OAuth not configured yet.' });
});

router.get('/google/callback', (req, res) => {
  // TODO: passport.authenticate('google', { failureRedirect: '/?error=auth_failed' })
  //       on success: res.redirect(CLIENT_URL + '/app/swipe')
  res.status(501).json({ message: 'Google OAuth not configured yet.' });
});

router.get('/current-user', (req, res) => {
  // TODO: if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json(null);
});

router.get('/logout', (req, res) => {
  // TODO: req.logout(() => req.session.destroy(() => res.redirect(CLIENT_URL)));
  res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
});

module.exports = router;
