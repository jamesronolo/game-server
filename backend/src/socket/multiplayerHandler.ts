import { Server, Socket } from 'socket.io';
import { Player, Room } from '../types/index.js';

export const rooms = new Map<string, Room>();

export function registerMultiplayerHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Create Multiplayer Lobby (Host)
    socket.on(
      'create_lobby',
      (
        data: { gameSlug: string; questionSetId: string; hostName?: string },
        callback?: (response: { success: boolean; code: string; room: Room }) => void
      ) => {
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
      }
    );

    // Join Multiplayer Lobby (Student)
    socket.on(
      'join_lobby',
      (
        data: { code: string; playerName: string; avatar?: string },
        callback?: (response: { success: boolean; code?: string; room?: Room; error?: string }) => void
      ) => {
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
      }
    );

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
}
