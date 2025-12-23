module.exports = (err, req, res, next) => {
  console.error('Unhandled error:', err && err.message, err && err.stack);
  res.status(err.status || 500).json({ message: process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error') });
};