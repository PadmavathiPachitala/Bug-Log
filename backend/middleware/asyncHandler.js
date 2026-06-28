const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('Async Handler Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  });

module.exports = asyncHandler;