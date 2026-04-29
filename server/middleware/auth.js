// TODO: replace next() with the real check once Passport sessions are active:
//   if (req.isAuthenticated()) return next();
//   res.status(401).json({ error: 'Not authenticated.' });
function ensureAuthenticated(req, res, next) {
  next();
}

module.exports = { ensureAuthenticated };
