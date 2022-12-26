module.exports = (err, req, res, next) => {
  const status = err.status || "error";
  const statusCode = err.statusCode || 500;

  res
    .status(statusCode)
    .json({ status, error: { message: err.message, stack: err.stack } });
};
