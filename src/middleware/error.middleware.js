export const errorHandler = (err, req, res, next) => {
  console.error({ err });
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message,
    stack: err.stack
  });
}

export const boomErrorHandler = (err, req, res, next) => {
  console.log({ err });
  if (err.isBoom) {
    const { output, data } = err;
    return res.status(output.statusCode).json({ ...output.payload, success: false, ...data });
  }
  next(err);
};

