import { Router } from 'express';
import { callProcedure } from '../db.js';

export const rewardsRouter = Router();

// GET /api/rewards/:studentId
rewardsRouter.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const rows = await callProcedure<any[]>('sp_get_rewards', [studentId]);

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
      unlockedStickerIds: rw.unlockedStickerIds
        ? typeof rw.unlockedStickerIds === 'string'
          ? JSON.parse(rw.unlockedStickerIds)
          : rw.unlockedStickerIds
        : [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rewards/:studentId
rewardsRouter.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { points, ticketsEarned, unlockedStickerIds } = req.body;

    const stickerJson = JSON.stringify(unlockedStickerIds || []);

    await callProcedure('sp_update_rewards', [
      studentId,
      points !== undefined ? points : null,
      ticketsEarned !== undefined ? ticketsEarned : null,
      stickerJson,
    ]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
