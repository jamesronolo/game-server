import { PoolConnection } from 'mysql2/promise';
import { PROGRAMMING_QUIZ_QUESTIONS } from '../seedData.js';

export async function verifyAndMigrateSchema(connection: PoolConnection) {
  await connection.query('SET NAMES utf8mb4');

  // Ensure programming quiz tables exist in MySQL
  await connection.query(`
    CREATE TABLE IF NOT EXISTS programming_quiz_questions (
      id VARCHAR(50) PRIMARY KEY,
      number INT NOT NULL,
      question TEXT NOT NULL,
      options LONGTEXT NOT NULL,
      correctOption VARCHAR(10) NOT NULL,
      explanation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS programming_quiz_attempts (
      id VARCHAR(100) PRIMARY KEY,
      studentName VARCHAR(255) NOT NULL,
      score INT NOT NULL DEFAULT 0,
      accuracy INT NOT NULL DEFAULT 0,
      totalQuestions INT NOT NULL DEFAULT 25,
      correctCount INT NOT NULL DEFAULT 0,
      completedAt VARCHAR(100) NOT NULL,
      answers LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure grades table exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(100) PRIMARY KEY,
      student_id VARCHAR(255) NOT NULL,
      student_name VARCHAR(255) NOT NULL DEFAULT '',
      subject VARCHAR(255) NOT NULL,
      grade_value VARCHAR(10) NOT NULL,
      term VARCHAR(100) NOT NULL DEFAULT '',
      notes TEXT,
      recorded_by VARCHAR(255) NOT NULL DEFAULT '',
      created_at VARCHAR(100) NOT NULL,
      INDEX idx_student_id (student_id(191))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Grades table verified.');

  // Ensure stored procedures have correct utf8mb4 collation to avoid illegal mix of collations
  await connection.query('DROP PROCEDURE IF EXISTS `sp_add_student`');
  await connection.query(`
    CREATE PROCEDURE \`sp_add_student\`(
      IN p_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_avatar VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    )
    BEGIN
      INSERT INTO \`roster\` (\`id\`, \`name\`, \`avatar\`, \`stars\`, \`points\`)
      VALUES (p_id, p_name, COALESCE(p_avatar, _utf8mb4'🧑' COLLATE utf8mb4_unicode_ci), 0, 0);
    END
  `);

  await connection.query('DROP PROCEDURE IF EXISTS `sp_update_student`');
  await connection.query(`
    CREATE PROCEDURE \`sp_update_student\`(
      IN p_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_avatar VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      IN p_stars INT,
      IN p_points INT
    )
    BEGIN
      UPDATE \`roster\`
      SET 
        \`name\` = COALESCE(p_name, \`name\`),
        \`avatar\` = COALESCE(p_avatar, \`avatar\`),
        \`stars\` = COALESCE(p_stars, \`stars\`),
        \`points\` = COALESCE(p_points, \`points\`)
      WHERE \`id\` = p_id;
      SELECT ROW_COUNT() AS affected_rows;
    END
  `);
  console.log('✅ Stored procedures sp_add_student & sp_update_student verified.');

  // Check if questions are seeded in MySQL
  const [qCount] = (await connection.query('SELECT COUNT(*) as count FROM programming_quiz_questions')) as any[];
  if (qCount && qCount[0] && qCount[0].count === 0) {
    console.log('🌱 Seeding 25 Programming Quiz questions into MySQL...');
    for (const q of PROGRAMMING_QUIZ_QUESTIONS) {
      await connection.query(
        'INSERT INTO programming_quiz_questions (id, number, question, options, correctOption, explanation) VALUES (?, ?, ?, ?, ?, ?)',
        [q.id, q.number, q.question, JSON.stringify(q.options), q.correctOption, q.explanation]
      );
    }
    console.log('✅ Programming Quiz questions seeded successfully in MySQL.');
  }
}
