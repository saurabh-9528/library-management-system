const morgan = require('morgan');

// Use dev format in development, combined/common format in production
const logger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
);

module.exports = logger;
