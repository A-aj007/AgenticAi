const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const config = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { initQueue, isRedisActive } = require('./queues/executionQueue');
const authService = require('./services/authService');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Security & Utility Middlewares
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
if (config.CLIENT_URL) {
  config.CLIENT_URL.split(',').map(url => url.trim()).filter(Boolean).forEach(url => {
    if (!allowedOrigins.includes(url)) allowedOrigins.push(url);
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Agentflow_AI API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    langGraphStatus: 'available',
    redisActive: isRedisActive(),
    nodeVersion: process.version,
    environment: config.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Bootstrap Server
const startServer = async () => {
  try {
    // 1. Connect Database (MongoDB or In-Memory fallback)
    await connectDB();

    // 2. Seed Default Operator Account
    await authService.seedDemoUserIfEmpty();

    // 3. Initialize Execution Queue (BullMQ or In-Memory fallback)
    initQueue();

    // 4. Start HTTP & WebSocket Server
    server.listen(config.PORT, () => {
      console.log(`====================================================`);
      console.log(` 🚀 Agentflow_AI Platform Server running on port ${config.PORT}`);
      console.log(` 📡 Real-Time WebSocket Hub: ready`);
      console.log(` 🌐 Client Origin: ${config.CLIENT_URL}`);
      console.log(` 🤖 Multi-Agent Orchestrator: online`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
