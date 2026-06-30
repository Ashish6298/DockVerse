import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import config from './config/index.js';
import logger from './utils/logger.js';
import router from './routes/docker.routes.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();
const httpServer = createServer(app);

// Request logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Incoming request');
  next();
});

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/v1', router);

// Error Handler
app.use(errorHandler);


// Server startup
const PORT = config.PORT;
const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 DockVerse API Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

// Graceful Shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.warn('Forcefully shutting down...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
