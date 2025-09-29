// Environment configuration
import dotenv from 'dotenv';
dotenv.config();

// Core dependencies
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';

// Application configuration
import passport from './config/authentication.config.js';
import { initDatabase } from './config/database.config.js';
import { swaggerUi, specs } from './config/documentation.config.js';

// Middleware
import { boomErrorHandler, errorHandler } from './middleware/error.middleware.js';

// Route modules
import authRoutes from './modules/authentication/auth.routes.js';
import currencyRoutes from './modules/currencies/currency.routes.js';
import fairRoutes from './modules/fairs/fair.routes.js';
import productRoutes from './modules/products/product.routes.js';
import reportRoutes from './modules/analytics/report.routes.js';
import saleRoutes from './modules/sales/sale.routes.js';
import scannerRoutes from './modules/scanning/scanner.routes.js';
import userRoutes from './modules/users/user.routes.js';


// Application constants
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'default-session-secret-change-in-production';

// Initialize Express application
const app = express();

/**
 * Security Middleware Configuration
 */
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // Requests per window
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', rateLimiter);

/**
 * Request Parsing Middleware
 */
app.use(express.json({
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

/**
 * Session Configuration
 */
app.use(session({
  key: 'ferias_session',
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

/**
 * Authentication Configuration
 */
app.use(passport.initialize());
app.use(passport.session());

/**
 * API Status Endpoint
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    environment: NODE_ENV,
    message: 'Ferias Backend API - Running Successfully',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    documentation: '/api/docs',
    endpoints: {
      authentication: '/api/v1/auth',
      users: '/api/v1/user',
      currencies: '/api/v1/currencies',
      fairs: '/api/v1/fairs',
      products: '/api/v1/products',
      sales: '/api/v1/sales',
      scanner: '/api/v1/scanner',
      analytics: '/api/v1/reports'
    },
    features: [
      'Hybrid JWT & Session Authentication',
      'Product Catalog Management',
      'Sales Transaction Processing',
      'Analytics & Reporting',
      'Barcode Generation & Scanning',
      'Multi-currency Support',
      'Enterprise Security Standards'
    ]
  });
});

/**
 * API Documentation
 */
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Ferias Backend API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true
  }
}));

/**
 * API Routes Configuration
 */
const API_VERSION = '/api/v1';

app.use(`${API_VERSION}/auth`, authRoutes);
app.use(`${API_VERSION}/user`, userRoutes);
app.use(`${API_VERSION}/currencies`, currencyRoutes);
app.use(`${API_VERSION}/fairs`, fairRoutes);
app.use(`${API_VERSION}/products`, productRoutes);
app.use(`${API_VERSION}/sales`, saleRoutes);
app.use(`${API_VERSION}/scanner`, scannerRoutes);
app.use(`${API_VERSION}/reports`, reportRoutes);

/**
 * Error Handling Middleware
 * Note: Must be placed after all routes
 */
app.use(boomErrorHandler);
app.use(errorHandler);

/**
 * 404 Handler - Catch all undefined routes
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: '/api/status'
  });
});

/**
 * Application Startup
 */
const startServer = async () => {
  try {
    // Initialize database connection
    await initDatabase();
    console.log('Database connection established successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('\n');
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Server running on port: ${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log(`API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`API Status: http://localhost:${PORT}/api/status`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the application
startServer();
