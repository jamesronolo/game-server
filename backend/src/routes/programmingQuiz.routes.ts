import { Router } from 'express';
import { pool } from '../db.js';

export const programmingQuizRouter = Router();

// GET /api/programming-quiz/questions
programmingQuizRouter.get('/questions', async (req, res) => {
  try {
    const [rows] = await pool.query<any[]>('SELECT id, number, question, options, correctOption, explanation FROM programming_quiz_questions ORDER BY number ASC');
    // Strip correctOption from public response so frontend can't cheat
    const safeRows = rows.map(({ correctOption: _co, explanation: _ex, ...rest }) => rest);
    res.json(safeRows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/programming-quiz/submit
programmingQuizRouter.post('/submit', async (req, res) => {
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

// GET /api/programming-quiz/attempts
programmingQuizRouter.get('/attempts', async (req, res) => {
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
