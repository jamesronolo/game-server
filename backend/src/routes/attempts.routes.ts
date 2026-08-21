import { Router } from 'express';
import { callProcedure } from '../db.js';

export const attemptsRouter = Router();

// GET /api/attempts
attemptsRouter.get('/', async (req, res) => {
  try {
    const attempts = await callProcedure<any[]>('sp_get_attempts');

    const result = [];
    for (const att of attempts) {
      const answers = await callProcedure<any[]>('sp_get_attempt_answers', [att.id]);

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

// POST /api/attempts
attemptsRouter.post('/', async (req, res) => {
  try {
    const attempt = req.body;
    const {
      assignmentId,
      studentId,
      studentName,
      questionSetId,
      questionSetTitle,
      gameSlug,
      score,
      accuracy,
      totalQuestions,
      correctCount,
      answers,
    } = attempt;

    const id = `att-${Date.now()}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await callProcedure('sp_record_attempt', [
      id,
      assignmentId || null,
      studentId,
      studentName,
      questionSetId,
      questionSetTitle,
      gameSlug,
      score || 0,
      accuracy || 0,
      totalQuestions || 0,
      correctCount || 0,
      now,
    ]);

    if (Array.isArray(answers)) {
      for (const ans of answers) {
        await callProcedure('sp_add_attempt_answer', [
          id,
          ans.questionId,
          ans.questionPrompt,
          ans.studentAnswer,
          ans.correctAnswer,
          ans.isCorrect ? 1 : 0,
        ]);
      }
    }

    // Award points and tickets to student rewards
    if (score > 0 && studentId) {
      const existingRewards = await callProcedure<any[]>('sp_get_rewards', [studentId]);
      let currentPoints = existingRewards && existingRewards.length > 0 ? existingRewards[0].points : 0;
      let newPoints = currentPoints + score;
      let newTickets = Math.floor(newPoints / 250);
      let currentStickers =
        existingRewards && existingRewards.length > 0
          ? existingRewards[0].unlockedStickerIds
          : JSON.stringify(['stk-1', 'stk-2']);

      const stickerJson = typeof currentStickers === 'string' ? currentStickers : JSON.stringify(currentStickers);

      await callProcedure('sp_update_rewards', [studentId, newPoints, newTickets, stickerJson]);
    }

    res.json({ success: true, id, completedAt: now });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
