const express = require('express');
const passport = require('passport');
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_URL}/?error=auth_failed` }),
  (req, res) => res.redirect(`${CLIENT_URL}/app/swipe`)
);

router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json(null);
});

router.get('/logout', (req, res) => {
  req.logout(() => req.session.destroy(() => res.redirect(CLIENT_URL)));
});

module.exports = router;
