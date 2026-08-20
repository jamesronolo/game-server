import { Router } from 'express';
import { callProcedure } from '../db.js';

export const assignmentsRouter = Router();

// GET /api/assignments
assignmentsRouter.get('/', async (req, res) => {
  try {
    const rows = await callProcedure<any[]>('sp_get_assignments');
    res.json(rows.map((a) => ({ ...a, rewardsEnabled: Boolean(a.rewardsEnabled) })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments
assignmentsRouter.post('/', async (req, res) => {
  try {
    const { teacherId, teacherName, classId, className, questionSetId, questionSetTitle, gameSlug, gameName, dueDate, rewardsEnabled } = req.body;

    const id = `asg-${Date.now()}`;
    const joinCode = `FUN-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await callProcedure('sp_create_assignment', [
      id,
      teacherId || null,
      teacherName || null,
      classId || null,
      className || null,
      questionSetId || null,
      questionSetTitle || null,
      gameSlug || null,
      gameName || null,
      joinCode,
      dueDate || null,
      rewardsEnabled ? 1 : 0,
      now,
    ]);

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

// DELETE /api/assignments/:id
assignmentsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await callProcedure('sp_delete_assignment', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
