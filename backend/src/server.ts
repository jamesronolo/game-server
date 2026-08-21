import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { apiRouter } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// SOCKET.IO REAL-TIME MULTIPLAYER LOBBY SYSTEM
// -------------------------------------------------------------
interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
}

interface Room {
  code: string;
  hostSocketId: string;
  gameSlug: string;
  questionSetId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  createdAt: number;
}

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // Create Multiplayer Lobby (Host)
  socket.on('create_lobby', (data: { gameSlug: string; questionSetId: string; hostName?: string }, callback) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const hostPlayer: Player = {
      id: `host-${socket.id}`,
      socketId: socket.id,
      name: data.hostName || 'Host Teacher',
      avatar: '👑',
      score: 0,
      isHost: true,
    };

    const room: Room = {
      code,
      hostSocketId: socket.id,
      gameSlug: data.gameSlug,
      questionSetId: data.questionSetId,
      status: 'waiting',
      players: [hostPlayer],
      createdAt: Date.now(),
    };

    rooms.set(code, room);
    socket.join(code);

    if (typeof callback === 'function') {
      callback({ success: true, code, room });
    }
  });

  // Join Multiplayer Lobby (Student)
  socket.on('join_lobby', (data: { code: string; playerName: string; avatar?: string }, callback) => {
    const room = rooms.get(data.code);
    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Room code not found' });
      }
      return;
    }

    const player: Player = {
      id: `p-${socket.id}`,
      socketId: socket.id,
      name: data.playerName,
      avatar: data.avatar || '🧑‍🎓',
      score: 0,
      isHost: false,
    };

    room.players.push(player);
    socket.join(data.code);

    io.to(data.code).emit('lobby_updated', { room });

    if (typeof callback === 'function') {
      callback({ success: true, code: data.code, room });
    }
  });

  // Host Starts Live Game
  socket.on('start_game', (data: { code: string }) => {
    const room = rooms.get(data.code);
    if (room && room.hostSocketId === socket.id) {
      room.status = 'playing';
      io.to(data.code).emit('game_started', { room });
    }
  });

  // Player Updates Score
  socket.on('update_score', (data: { code: string; scoreDelta: number }) => {
    const room = rooms.get(data.code);
    if (room) {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (player) {
        player.score += data.scoreDelta;
        io.to(data.code).emit('lobby_updated', { room });
      }
    }
  });

  // Disconnect & Leave
  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      const idx = room.players.findIndex((p) => p.socketId === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          io.to(code).emit('lobby_updated', { room });
        }
      }
    }
  });
});

// -------------------------------------------------------------
// MOUNT MODULAR API ROUTES
// -------------------------------------------------------------
app.use('/api', apiRouter);

// -------------------------------------------------------------
// BOOTSTRAP SERVER
// -------------------------------------------------------------
async function start() {
  await initDatabase();

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 EduPlay Backend Server with Socket.IO listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
