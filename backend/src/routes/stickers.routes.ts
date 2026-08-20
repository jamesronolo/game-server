import { Router } from 'express';
import { callProcedure } from '../db.js';

export const stickersRouter = Router();

// GET /api/stickers
stickersRouter.get('/', async (req, res) => {
  try {
    const rows = await callProcedure<any[]>('sp_get_stickers');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
