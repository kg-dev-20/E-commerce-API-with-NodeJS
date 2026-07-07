export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({ message: `Duplicate value for field(s): ${err.meta?.target}` });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found' });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

