const express = require('express');
const passport = require('passport');
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function getClientOriginFromRequest(req) {
  const fromOriginHeader = req.get('origin');
  if (fromOriginHeader) return fromOriginHeader;

  const referer = req.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function getClientUrl(req) {
  return req.session?.oauthClientUrl || CLIENT_URL;
}

router.get('/google', (req, res, next) => {
  const origin = getClientOriginFromRequest(req);
  if (origin && req.session) {
    req.session.oauthClientUrl = origin;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    const clientUrl = getClientUrl(req);
    if (req.session) delete req.session.oauthClientUrl;

    if (err || !user) {
      return res.redirect(`${clientUrl}/login?error=auth_failed`);
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return res.redirect(`${clientUrl}/login?error=auth_failed`);
      return res.redirect(`${clientUrl}/app/swipe`);
    });
  })(req, res, next);
});

router.get('/current-user', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json(null);
});

router.get('/logout', (req, res) => {
  const clientUrl = getClientUrl(req);
  if (req.session) delete req.session.oauthClientUrl;
  req.logout(() => {
    req.session.destroy(() => res.redirect(clientUrl));
  });
});

module.exports = router;
