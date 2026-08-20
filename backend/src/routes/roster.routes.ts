import { Router } from 'express';
import { callProcedure } from '../db.js';

export const rosterRouter = Router();

// GET /api/roster
rosterRouter.get('/', async (req, res) => {
  try {
    const rows = await callProcedure<any[]>('sp_get_roster');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/roster
rosterRouter.post('/', async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const id = `student-${Date.now()}`;
    await callProcedure('sp_add_student', [id, name, avatar || '🧑']);
    res.json({ id, name, avatar: avatar || '🧑', stars: 0, points: 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/roster/:id
rosterRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, stars, points } = req.body;
    await callProcedure('sp_update_student', [
      id,
      name ?? null,
      avatar ?? null,
      stars !== undefined ? stars : null,
      points !== undefined ? points : null,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/roster/:id
rosterRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await callProcedure('sp_delete_student', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
