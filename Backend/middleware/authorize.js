// Usage: authorize('principal', 'faculty')
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.role))
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  next();
};
