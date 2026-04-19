// Global async error handler — wrap controllers with this
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Global error middleware — add as last app.use in server.js
const errorMiddleware = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} —`, err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

module.exports = { asyncHandler, errorMiddleware };
