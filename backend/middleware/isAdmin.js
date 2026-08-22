module.exports = function (req, res, next) {
  // This runs after auth.js, so req.user is already decoded
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin clearance required.' });
  }
  next();
};