const AppError = require('../utils/appError');

/**
 * Middleware wrapper to validate request body using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Where to look for data: 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    if (!dataToValidate) {
      return next(new AppError('No data provided for validation', 400));
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys (good for security/schema hygiene)
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join('. ');
      return next(new AppError(errorMessages, 400));
    }

    // Replace request data with the validated/cleaned values (handles defaults/stripping)
    req[source] = value;
    next();
  };
};

module.exports = validate;
