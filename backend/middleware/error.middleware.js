const AppError = require('../utils/appError');

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}. Please check your identifier format.`;
  return new AppError(message, 400);
};

const handleDuplicateKeyDb = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong on the server.'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Handle Mongoose specific validation and Cast errors
  if (err.name === 'ValidationError') error = handleValidationErrorDb(err);
  if (err.name === 'CastError') error = handleCastErrorDb(err);
  if (err.code === 11000) error = handleDuplicateKeyDb(err);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};
