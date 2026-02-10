import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { connectMongoDB } from './db/mongodb.js';
import { redis } from './db/redis.js';
import { initDatabase } from './db/init.js';
import { setupPingSchedule } from './queues/ping.queue.js';
import authRoutes from './routes/auth.routes.js';
import monitorsRoutes from './routes/monitors.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import exportRoutes from './routes/export.routes.js';
import publicRoutes from './routes/public.routes.js';
import apiKeysRoutes from './routes/apiKeys.routes.js';
import { apiRateLimiter } from './middleware/rateLimit.middleware.js';
import { sanitizeBody } from './middleware/sanitize.middleware.js';
import env from './config/env.js';
// Import worker to run in same process
import './workers/ping.worker.js';

const app = express();

// Trust proxy to get real client IP through Nginx
app.set('trust proxy', true);

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'sameorigin' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://sentinelcloud.vercel.app', // Vercel deployment
        'http://65.2.31.27', // EC2 IP (if web still runs there)
      ]
    : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(sanitizeBody); // Input sanitization for XSS prevention
// Apply global rate limit only to non-auth routes so login/refresh are not blocked
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next();
  return apiRateLimiter(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitors', monitorsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/api-keys', apiKeysRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

async function start() {
  try {
    // Initialize PostgreSQL schema
    await initDatabase();

    // Connect to databases
    await connectMongoDB();
    console.log('✅ MongoDB connected');

    // Redis connection is handled in redis.ts
    await redis.ping();
    console.log('✅ Redis connected');

    // Setup ping schedule
    await setupPingSchedule();

    // Worker is now running in the same process
    console.log('✅ Background worker started in same process');

    // Start server
    app.listen(env.API_PORT, () => {
      console.log(`🚀 API server running on port ${env.API_PORT}`);
      console.log('💼 Worker and API combined - optimized for t2.micro');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
