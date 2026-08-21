import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { pool, initDatabase, isInMemoryMode } from './db.js';

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

// Helper for Gemini AI client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({
      status: 'ok',
      db: isInMemoryMode ? 'in-memory-fallback' : 'connected',
      activeSockets: io.sockets.sockets.size,
      activeRooms: rooms.size,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// -------------------------------------------------------------
// USERS API
// -------------------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, name, email, role, is_pro as isPro, avatar_url as avatarUrl, class_name as className FROM users');
    res.json(rows.map((u) => ({ ...u, isPro: Boolean(u.isPro) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPro, name, email, avatarUrl, className } = req.body;
    await pool.query(
      'UPDATE users SET is_pro = COALESCE(?, is_pro), name = COALESCE(?, name), email = COALESCE(?, email), avatar_url = COALESCE(?, avatar_url), class_name = COALESCE(?, class_name) WHERE id = ?',
      [isPro !== undefined ? isPro : null, name || null, email || null, avatarUrl || null, className || null, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GAMES API
// -------------------------------------------------------------
app.get('/api/games', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, name, slug, description, mechanic, badge, category, min_grade as minGrade, icon_name as iconName, gradient_bg as gradientBg, accent_color as accentColor, image_url as imageUrl FROM games');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// QUESTION SETS API
// -------------------------------------------------------------
app.get('/api/question-sets', async (req, res) => {
  try {
    const [sets] = await pool.query<any[]>('SELECT id, owner_id as ownerId, owner_name as ownerName, title, description, subject, grade_level as gradeLevel, is_public as isPublic, tags, created_at as createdAt, updated_at as updatedAt FROM question_sets ORDER BY updated_at DESC');

    const result = [];
    for (const s of sets) {
      const [questions] = await pool.query<any[]>('SELECT id, set_id as setId, prompt_text as promptText, answer, options, type, position, hint FROM questions WHERE set_id = ? ORDER BY position ASC', [s.id]);

      result.push({
        ...s,
        isPublic: Boolean(s.isPublic),
        tags: s.tags ? (typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags) : [],
        questions: (questions || []).map((q: any) => ({
          ...q,
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
        })),
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/question-sets', async (req, res) => {
  try {
    const set = req.body;
    const { id, ownerId, ownerName, title, description, subject, gradeLevel, isPublic, tags, questions } = set;

    const tagsJson = JSON.stringify(tags || []);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [existing] = await pool.query<any[]>('SELECT id FROM question_sets WHERE id = ?', [id]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE question_sets SET title = ?, description = ?, subject = ?, grade_level = ?, is_public = ?, tags = ?, updated_at = ? WHERE id = ?',
        [title, description, subject, gradeLevel, isPublic ? 1 : 0, tagsJson, now, id]
      );
      await pool.query('DELETE FROM questions WHERE set_id = ?', [id]);
    } else {
      await pool.query(
        'INSERT INTO question_sets (id, owner_id, owner_name, title, description, subject, grade_level, is_public, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, ownerId, ownerName, title, description, subject, gradeLevel, isPublic ? 1 : 0, tagsJson, now, now]
      );
    }

    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = q.id || `q-${id}-${i + 1}`;
        const optionsJson = JSON.stringify(q.options || []);
        await pool.query(
          'INSERT INTO questions (id, set_id, prompt_text, answer, options, type, position, hint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [qId, id, q.promptText, q.answer, optionsJson, q.type || 'multiple_choice', q.position || i + 1, q.hint || null]
        );
      }
    }

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/question-sets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM question_sets WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ASSIGNMENTS API
// -------------------------------------------------------------
app.get('/api/assignments', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, teacher_id as teacherId, teacher_name as teacherName, class_id as classId, class_name as className, question_set_id as questionSetId, question_set_title as questionSetTitle, game_slug as gameSlug, game_name as gameName, join_code as joinCode, due_date as dueDate, rewards_enabled as rewardsEnabled, created_at as createdAt FROM assignments ORDER BY created_at DESC');
    res.json(rows.map((a) => ({ ...a, rewardsEnabled: Boolean(a.rewardsEnabled) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const { teacherId, teacherName, classId, className, questionSetId, questionSetTitle, gameSlug, gameName, dueDate, rewardsEnabled } = req.body;

    const id = `asg-${Date.now()}`;
    const joinCode = `FUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'INSERT INTO assignments (id, teacher_id, teacher_name, class_id, class_name, question_set_id, question_set_title, game_slug, game_name, join_code, due_date, rewards_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, teacherId, teacherName, classId, className, questionSetId, questionSetTitle, gameSlug, gameName, joinCode, dueDate, rewardsEnabled ? 1 : 0, now]
    );

    res.json({
      id,
      teacherId,
      teacherName,
      classId,
      className,
      questionSetId,
      questionSetTitle,
      gameSlug,
      gameName,
      joinCode,
      dueDate,
      rewardsEnabled: Boolean(rewardsEnabled),
      createdAt: now,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM assignments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ATTEMPTS API
// -------------------------------------------------------------
app.get('/api/attempts', async (req, res) => {
  try {
    const [attempts] = await pool.query<any[]>('SELECT id, assignment_id as assignmentId, student_id as studentId, student_name as studentName, question_set_id as questionSetId, question_set_title as questionSetTitle, game_slug as gameSlug, score, accuracy, total_questions as totalQuestions, correct_count as correctCount, completed_at as completedAt FROM attempts ORDER BY completed_at DESC');

    const result = [];
    for (const att of attempts) {
      const [answers] = await pool.query<any[]>('SELECT question_id as questionId, question_prompt as questionPrompt, student_answer as studentAnswer, correct_answer as correctAnswer, is_correct as isCorrect FROM attempt_answers WHERE attempt_id = ?', [att.id]);

      result.push({
        ...att,
        answers: (answers || []).map((ans: any) => ({ ...ans, isCorrect: Boolean(ans.isCorrect) })),
      });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attempts', async (req, res) => {
  try {
    const attempt = req.body;
    const { assignmentId, studentId, studentName, questionSetId, questionSetTitle, gameSlug, score, accuracy, totalQuestions, correctCount, answers } = attempt;

    const id = `att-${Date.now()}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'INSERT INTO attempts (id, assignment_id, student_id, student_name, question_set_id, question_set_title, game_slug, score, accuracy, total_questions, correct_count, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, assignmentId || null, studentId, studentName, questionSetId, questionSetTitle, gameSlug, score || 0, accuracy || 0, totalQuestions || 0, correctCount || 0, now]
    );

    if (Array.isArray(answers)) {
      for (const ans of answers) {
        await pool.query(
          'INSERT INTO attempt_answers (attempt_id, question_id, question_prompt, student_answer, correct_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
          [id, ans.questionId, ans.questionPrompt, ans.studentAnswer, ans.correctAnswer, ans.isCorrect ? 1 : 0]
        );
      }
    }

    if (score > 0 && studentId) {
      const [rewards] = await pool.query<any[]>('SELECT points, tickets_earned FROM rewards WHERE student_id = ?', [studentId]);
      let currentPoints = rewards && rewards.length > 0 ? rewards[0].points : 0;
      let newPoints = currentPoints + score;
      let newTickets = Math.floor(newPoints / 250);

      if (rewards && rewards.length > 0) {
        await pool.query('UPDATE rewards SET points = ?, tickets_earned = ? WHERE student_id = ?', [newPoints, newTickets, studentId]);
      } else {
        await pool.query('INSERT INTO rewards (student_id, points, tickets_earned, unlocked_sticker_ids) VALUES (?, ?, ?, ?)', [studentId, newPoints, newTickets, JSON.stringify(['stk-1', 'stk-2'])]);
      }
    }

    res.json({ success: true, id, completedAt: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// STICKERS API
// -------------------------------------------------------------
app.get('/api/stickers', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, name, rarity, category, emoji, description FROM stickers');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ROSTER API
// -------------------------------------------------------------
app.get('/api/roster', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, name, avatar, stars, points FROM roster');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/roster', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const id = `student-${Date.now()}`;
    await pool.query('INSERT INTO roster (id, name, avatar, stars, points) VALUES (?, ?, ?, 0, 0)', [id, name, avatar || '🧑']);
    res.json({ id, name, avatar: avatar || '🧑', stars: 0, points: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/roster/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, stars, points } = req.body;

    await pool.query(
      'UPDATE roster SET name = COALESCE(?, name), avatar = COALESCE(?, avatar), stars = COALESCE(?, stars), points = COALESCE(?, points) WHERE id = ?',
      [name || null, avatar || null, stars !== undefined ? stars : null, points !== undefined ? points : null, id]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/roster/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM roster WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// REWARDS API
// -------------------------------------------------------------
app.get('/api/rewards/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.query<any[]>('SELECT student_id as studentId, points, tickets_earned as ticketsEarned, unlocked_sticker_ids as unlockedStickerIds FROM rewards WHERE student_id = ?', [studentId]);

    if (!rows || rows.length === 0) {
      return res.json({
        studentId,
        points: 450,
        ticketsEarned: 2,
        unlockedStickerIds: ['stk-1', 'stk-2'],
      });
    }

    const rw = rows[0];
    res.json({
      ...rw,
      unlockedStickerIds: rw.unlockedStickerIds ? (typeof rw.unlockedStickerIds === 'string' ? JSON.parse(rw.unlockedStickerIds) : rw.unlockedStickerIds) : [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rewards/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { points, ticketsEarned, unlockedStickerIds } = req.body;

    const stickerJson = JSON.stringify(unlockedStickerIds || []);

    const [existing] = await pool.query<any[]>('SELECT student_id FROM rewards WHERE student_id = ?', [studentId]);

    if (existing && existing.length > 0) {
      await pool.query(
        'UPDATE rewards SET points = COALESCE(?, points), tickets_earned = COALESCE(?, tickets_earned), unlocked_sticker_ids = ? WHERE student_id = ?',
        [points !== undefined ? points : null, ticketsEarned !== undefined ? ticketsEarned : null, stickerJson, studentId]
      );
    } else {
      await pool.query(
        'INSERT INTO rewards (student_id, points, tickets_earned, unlocked_sticker_ids) VALUES (?, ?, ?, ?)',
        [studentId, points || 0, ticketsEarned || 0, stickerJson]
      );
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// AI QUESTION SET GENERATOR API
// -------------------------------------------------------------
app.post('/api/ai/generate-set', async (req, res) => {
  try {
    const { topic, gradeLevel, count = 5, subject = 'General' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
        useFallback: true,
      });
    }

    const prompt = `Create an educational question set about "${topic}" for grade level "${gradeLevel || 'Grade 3'}". Subject: "${subject}". Generate ${count} high-quality, engaging questions. Each question must have promptText, 4 distinct options (multiple choice), correct answer (which must match one of the options), and a helpful hint.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert K-12 educator creating interactive learning question sets. Provide strictly valid JSON conforming to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            subject: { type: Type.STRING },
            gradeLevel: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  promptText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  answer: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['promptText', 'options', 'answer', 'hint'],
              },
            },
          },
          required: ['title', 'subject', 'gradeLevel', 'questions'],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('No response text received from Gemini API');
    }

    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error('AI Generation error:', err);
    res.status(500).json({ error: err.message || 'Internal server error', useFallback: true });
  }
});

// -------------------------------------------------------------
// PROGRAMMING QUIZ API
// -------------------------------------------------------------
app.get('/api/programming-quiz/questions', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, number, question, options, correctOption, explanation FROM programming_quiz_questions ORDER BY number ASC');
    // Strip correctOption from public response so frontend can't cheat
    const safeRows = rows.map(({ correctOption: _co, explanation: _ex, ...rest }) => rest);
    res.json(safeRows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/programming-quiz/submit', async (req, res) => {
  try {
    const { answers, studentName } = req.body as {
      answers: { questionId: string; selectedOption: string }[];
      studentName?: string;
    };

    const [questions] = await pool.query<any[]>('SELECT id, number, question, options, correctOption, explanation FROM programming_quiz_questions ORDER BY number ASC');

    const graded = answers.map((a) => {
      const q = questions.find((q: any) => q.id === a.questionId);
      if (!q) return null;
      const isCorrect = a.selectedOption === q.correctOption;
      const optionIndex = ['A','B','C','D'].indexOf(q.correctOption);
      const correctAnswer = q.options[optionIndex] ?? q.correctOption;
      return {
        questionId: q.id,
        number: q.number,
        question: q.question,
        selectedOption: a.selectedOption,
        correctOption: q.correctOption,
        correctAnswer,
        explanation: q.explanation,
        isCorrect,
        points: isCorrect ? 1 : 0,
      };
    }).filter(Boolean);

    const correctCount = graded.filter((g: any) => g.isCorrect).length;
    const totalQuestions = graded.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const score = correctCount; // 1 point per correct answer (total out of 25)

    const id = `pqa-${Date.now()}`;
    const completedAt = new Date().toISOString();
    const name = studentName || 'Anonymous';

    await pool.query(
      'INSERT INTO programming_quiz_attempts (id, studentName, score, accuracy, totalQuestions, correctCount, completedAt, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, score, accuracy, totalQuestions, correctCount, completedAt, JSON.stringify(graded)]
    );

    res.json({ success: true, id, score, accuracy, totalQuestions, correctCount, completedAt, graded });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/programming-quiz/attempts', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, studentName, score, accuracy, totalQuestions, correctCount, completedAt, answers FROM programming_quiz_attempts');
    res.json(rows.map((r: any) => ({
      ...r,
      answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Bootstrapping function
async function start() {
  await initDatabase();

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 EduPlay Backend Server with Socket.IO listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
