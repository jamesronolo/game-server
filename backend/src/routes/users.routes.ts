import { Router } from 'express';
import { callProcedure } from '../db.js';

export const usersRouter = Router();

// GET /api/users
usersRouter.get('/', async (req, res) => {
  try {
    const rows = await callProcedure<any[]>('sp_get_users');
    res.json(rows.map((u) => ({ ...u, isPro: Boolean(u.isPro) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
usersRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isPro, avatarUrl, className } = req.body;
    await callProcedure('sp_update_user', [
      id,
      name ?? null,
      email ?? null,
      isPro !== undefined ? (isPro ? 1 : 0) : null,
      avatarUrl ?? null,
      className ?? null,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
