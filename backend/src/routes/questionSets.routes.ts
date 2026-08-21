import { Router } from 'express';
import { callProcedure } from '../db.js';

export const questionSetsRouter = Router();

// GET /api/question-sets
questionSetsRouter.get('/', async (req, res) => {
  try {
    const sets = await callProcedure<any[]>('sp_get_question_sets');

    const result = [];
    for (const s of sets) {
      const questions = await callProcedure<any[]>('sp_get_questions_by_set_id', [s.id]);

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

// GET /api/question-sets/:id
questionSetsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sets = await callProcedure<any[]>('sp_get_question_set_by_id', [id]);
    if (!sets || sets.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    const s = sets[0];
    const questions = await callProcedure<any[]>('sp_get_questions_by_set_id', [id]);

    res.json({
      ...s,
      isPublic: Boolean(s.isPublic),
      tags: s.tags ? (typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags) : [],
      questions: (questions || []).map((q: any) => ({
        ...q,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/question-sets
questionSetsRouter.post('/', async (req, res) => {
  try {
    const set = req.body;
    const { id, ownerId, ownerName, title, description, subject, gradeLevel, isPublic, tags, questions } = set;

    const tagsJson = JSON.stringify(tags || []);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await callProcedure('sp_upsert_question_set', [
      id,
      ownerId || null,
      ownerName || null,
      title,
      description || null,
      subject || null,
      gradeLevel || null,
      isPublic ? 1 : 0,
      tagsJson,
      now,
      now,
    ]);

    await callProcedure('sp_delete_questions_by_set_id', [id]);

    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qId = q.id || `q-${id}-${i + 1}`;
        const optionsJson = JSON.stringify(q.options || []);
        await callProcedure('sp_insert_question', [
          qId,
          id,
          q.promptText,
          q.answer,
          optionsJson,
          q.type || 'multiple_choice',
          q.position || i + 1,
          q.hint || null,
        ]);
      }
    }

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/question-sets/:id
questionSetsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await callProcedure('sp_delete_questions_by_set_id', [id]);
    await callProcedure('sp_delete_question_set', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
