const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./middleware/logger.middleware');
const errorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/appError');
const { protect } = require('./middleware/authMiddleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const bookRoutes = require('./routes/book.routes');
const memberRoutes = require('./routes/member.routes');
const txnRoutes = require('./routes/txn.routes');
const resRoutes = require('./routes/res.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Trust proxy for secure cookies in production (behind Render load balancers)
app.set('trust proxy', 1);

// 1. Global Middleware
// CORS configuration supporting dynamic/multiple origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like postman or local requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Set security HTTP headers
app.use(helmet());

// HTTP Request logging
app.use(logger);

// Body parser
app.use(express.json());

// Cookie parser (reads cookies from request into req.cookies)
app.use(cookieParser());

// Health check (public)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 2. Auth Routes (Public: Register, Login, Logout)
app.use('/api/auth', authRoutes);

// 3. Protected Routes (Require valid JWT)
app.use(protect);

app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/reservations', resRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 4. Fallback Route: Handle unhandled routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Global Error Handler
app.use(errorHandler);

module.exports = app;
