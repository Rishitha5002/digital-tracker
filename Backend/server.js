import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import socketHandler from './sockets/socketHandler.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trip.js';
import adminRoutes from './routes/admin.js';
import expenseRoutes from './routes/expenses.js';
import analyticsRoutes from './routes/analytics.js';
import supportRoutes from './routes/support.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const allowedOrigins = [
  'https://location-tracker56.netlify.app',
  'https://digital-tracker-backend.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://192.168.0.4:5000',
  'http://10.79.138.49:3000',
  'http://10.79.138.49:8081',
  'http://10.79.138.49:5000',
  'http://10.79.138.49:19000',
  'http://10.79.138.49:19006',
  'exp://10.79.138.49:8081',
  'http://192.168.31.156:3000',
  'http://192.168.31.156:8081',
  'http://192.168.31.156:5000',
  'http://192.168.31.156:19000',
  'http://192.168.31.156:19006',
  'exp://192.168.31.156:8081'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy error'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

const startServer = async () => {
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  app.use(cors(corsOptions));
  app.use(express.json());

  const io = new Server(server, { cors: corsOptions });
  socketHandler(io);

  app.use('/api/auth', authRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/chat', chatRoutes);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
