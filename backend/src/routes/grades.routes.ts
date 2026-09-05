import { Router } from "express";
import { pool, isInMemoryMode, memoryStore } from "../db.js";

export const gradesRouter = Router();

// ---- Helper: run grade query against MySQL or in-memory ----
async function queryGrades(studentId?: string | null): Promise<any[]> {
  if (!isInMemoryMode) {
    try {
      const sql = studentId
        ? "SELECT id, student_id AS studentId, student_name AS studentName, subject, grade_value AS gradeValue, term, notes, recorded_by AS recordedBy, created_at AS createdAt FROM grades WHERE student_id = ? ORDER BY created_at DESC"
        : "SELECT id, student_id AS studentId, student_name AS studentName, subject, grade_value AS gradeValue, term, notes, recorded_by AS recordedBy, created_at AS createdAt FROM grades ORDER BY created_at DESC";
      const params = studentId ? [studentId] : [];
      const [rows] = await pool.query<any[]>(sql, params);
      return rows;
    } catch (_) { /* fall through to in-memory */ }
  }
  const g = (memoryStore as any).grades as any[] ?? [];
  return studentId ? g.filter((r: any) => r.studentId === studentId) : [...g];
}

// GET /api/grades?studentId=xxx
gradesRouter.get("/", async (req, res) => {
  try {
    const { studentId } = req.query;
    const rows = await queryGrades(studentId as string | undefined);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/grades
gradesRouter.post("/", async (req, res) => {
  try {
    const { studentId, studentName, subject, gradeValue, term, notes, recordedBy } = req.body;
    if (!studentId || !subject || !gradeValue) {
      return res.status(400).json({ error: "studentId, subject, and gradeValue are required." });
    }
    const id = `gr-${Date.now()}`;
    const createdAt = new Date().toISOString();

    if (!isInMemoryMode) {
      try {
        await pool.query(
          "INSERT INTO grades (id, student_id, student_name, subject, grade_value, term, notes, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [id, studentId, studentName ?? "", subject, gradeValue, term ?? "", notes ?? "", recordedBy ?? "", createdAt]
        );
        return res.json({ success: true, id, createdAt });
      } catch (_) { /* fall through to in-memory */ }
    }
    // In-memory
    (memoryStore as any).grades.unshift({ id, studentId, studentName: studentName ?? "", subject, gradeValue, term: term ?? "", notes: notes ?? "", recordedBy: recordedBy ?? "", createdAt });
    res.json({ success: true, id, createdAt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/grades/:id
gradesRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, studentName, subject, gradeValue, term, notes, recordedBy } = req.body;

    if (!isInMemoryMode) {
      try {
        await pool.query(
          `UPDATE grades SET
            student_id = COALESCE(?, student_id),
            student_name = COALESCE(?, student_name),
            subject = COALESCE(?, subject),
            grade_value = COALESCE(?, grade_value),
            term = COALESCE(?, term),
            notes = COALESCE(?, notes),
            recorded_by = COALESCE(?, recorded_by)
          WHERE id = ?`,
          [studentId ?? null, studentName ?? null, subject ?? null, gradeValue ?? null, term ?? null, notes ?? null, recordedBy ?? null, id]
        );
        return res.json({ success: true });
      } catch (_) { /* fall through to in-memory */ }
    }
    // In-memory
    const grades = (memoryStore as any).grades as any[];
    const idx = grades.findIndex((g: any) => g.id === id);
    if (idx >= 0) {
      grades[idx] = {
        ...grades[idx],
        ...(studentId !== undefined && { studentId }),
        ...(studentName !== undefined && { studentName }),
        ...(subject !== undefined && { subject }),
        ...(gradeValue !== undefined && { gradeValue }),
        ...(term !== undefined && { term }),
        ...(notes !== undefined && { notes }),
        ...(recordedBy !== undefined && { recordedBy }),
      };
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/grades/:id
gradesRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isInMemoryMode) {
      try {
        await pool.query("DELETE FROM grades WHERE id = ?", [id]);
        return res.json({ success: true });
      } catch (_) { /* fall through to in-memory */ }
    }
    // In-memory
    const grades = (memoryStore as any).grades as any[];
    const idx = grades.findIndex((g: any) => g.id === id);
    if (idx >= 0) grades.splice(idx, 1);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
