import { Router } from 'express';
import { callProcedure } from '../db.js';

export const gamesRouter = Router();

// GET /api/games
gamesRouter.get('/', async (req, res) => {
  try {
    const rows = await callProcedure<any[]>('sp_get_games');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
