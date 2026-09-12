import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { apiRouter } from './routes/index.js';
import { registerMultiplayerHandlers } from './socket/multiplayerHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// HTTP & WebSocket Server Setup
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount Socket.IO Real-time Multiplayer Lobby System
registerMultiplayerHandlers(io);

// Mount Modular API Routes
app.use('/api', apiRouter);

// Bootstrap Server
async function start() {
  await initDatabase();

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 EduPlay Backend Server with Socket.IO listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
