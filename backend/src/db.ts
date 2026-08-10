import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import {
  INITIAL_USERS,
  INITIAL_GAMES,
  INITIAL_QUESTION_SETS,
  INITIAL_ASSIGNMENTS,
  INITIAL_ATTEMPTS,
  INITIAL_STICKERS,
  INITIAL_ROSTER,
  INITIAL_REWARDS,
} from './seedData.js';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'games',
  password: process.env.DB_PASSWORD || 'games',
  database: process.env.DB_NAME || 'games',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDatabase() {
  console.log('🔄 Initializing MySQL database connection & schemas...');

  try {
    const connection = await pool.getConnection();
    await connection.query('SET NAMES utf8mb4');
    await connection.query('ALTER DATABASE games CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci');

    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_pro BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        class_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Games table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(191) NOT NULL UNIQUE,
        description TEXT,
        mechanic VARCHAR(255),
        badge VARCHAR(100),
        category VARCHAR(100),
        min_grade VARCHAR(100),
        icon_name VARCHAR(100),
        gradient_bg VARCHAR(255),
        accent_color VARCHAR(100),
        image_url TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Question Sets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS question_sets (
        id VARCHAR(191) PRIMARY KEY,
        owner_id VARCHAR(191),
        owner_name VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(255),
        grade_level VARCHAR(100),
        is_public BOOLEAN DEFAULT TRUE,
        tags TEXT,
        created_at DATETIME,
        updated_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Questions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(191) PRIMARY KEY,
        set_id VARCHAR(191) NOT NULL,
        prompt_text TEXT NOT NULL,
        answer TEXT NOT NULL,
        options TEXT,
        type VARCHAR(50) DEFAULT 'multiple_choice',
        position INT DEFAULT 1,
        hint TEXT,
        FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Assignments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(191) PRIMARY KEY,
        teacher_id VARCHAR(191),
        teacher_name VARCHAR(255),
        class_id VARCHAR(191),
        class_name VARCHAR(255),
        question_set_id VARCHAR(191),
        question_set_title VARCHAR(255),
        game_slug VARCHAR(191),
        game_name VARCHAR(255),
        join_code VARCHAR(100) UNIQUE,
        due_date VARCHAR(100),
        rewards_enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Attempts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attempts (
        id VARCHAR(191) PRIMARY KEY,
        assignment_id VARCHAR(191),
        student_id VARCHAR(191),
        student_name VARCHAR(255),
        question_set_id VARCHAR(191),
        question_set_title VARCHAR(255),
        game_slug VARCHAR(191),
        score INT DEFAULT 0,
        accuracy INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        correct_count INT DEFAULT 0,
        completed_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Attempt Answers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attempt_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id VARCHAR(191) NOT NULL,
        question_id VARCHAR(191),
        question_prompt TEXT,
        student_answer TEXT,
        correct_answer TEXT,
        is_correct BOOLEAN,
        FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Stickers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stickers (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rarity VARCHAR(100),
        category VARCHAR(100),
        emoji VARCHAR(50) CHARACTER SET utf8mb4,
        description TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      await connection.query('ALTER TABLE stickers MODIFY emoji VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    } catch (e) {
      // Ignore if table was newly created
    }

    // 9. Class Roster table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roster (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT 'student',
        stars INT DEFAULT 0,
        points INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      await connection.query('ALTER TABLE roster MODIFY avatar VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    } catch (e) {
      // Ignore
    }

    // 10. Student Rewards table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        student_id VARCHAR(191) PRIMARY KEY,
        points INT DEFAULT 0,
        tickets_earned INT DEFAULT 0,
        unlocked_sticker_ids TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // --- SEED DATA IF TABLES ARE EMPTY ---
    const [userRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('🌱 Seeding initial Users...');
      for (const u of INITIAL_USERS) {
        await connection.query(
          'INSERT INTO users (id, name, email, role, is_pro, avatar_url, class_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.name, u.email, u.role, u.is_pro, u.avatar_url, u.class_name]
        );
      }
    }

    const [gameRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM games');
    if (gameRows[0].count === 0) {
      console.log('🌱 Seeding initial Games catalog...');
      for (const g of INITIAL_GAMES) {
        await connection.query(
          'INSERT INTO games (id, name, slug, description, mechanic, badge, category, min_grade, icon_name, gradient_bg, accent_color, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [g.id, g.name, g.slug, g.description, g.mechanic, g.badge, g.category, g.min_grade, g.icon_name, g.gradient_bg, g.accent_color, g.image_url]
        );
      }
    }

    console.log('🌱 Seeding & Syncing Question Sets & Questions...');
    for (const s of INITIAL_QUESTION_SETS.filter(Boolean)) {
      const [existing] = await connection.query<any[]>('SELECT id FROM question_sets WHERE id = ?', [s.id]);
      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO question_sets (id, owner_id, owner_name, title, description, subject, grade_level, is_public, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            s.id,
            s.ownerId || (s as any).owner_id,
            s.ownerName || (s as any).owner_name,
            s.title,
            s.description,
            s.subject,
            s.gradeLevel || (s as any).grade_level,
            s.isPublic !== undefined ? s.isPublic : ((s as any).is_public !== undefined ? (s as any).is_public : true),
            typeof s.tags === 'string' ? s.tags : JSON.stringify(s.tags),
            s.createdAt || (s as any).created_at || new Date().toISOString(),
            s.updatedAt || (s as any).updated_at || new Date().toISOString(),
          ]
        );

        for (const q of s.questions) {
          await connection.query(
            'INSERT INTO questions (id, set_id, prompt_text, answer, options, type, position, hint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              q.id,
              s.id,
              (q as any).promptText || (q as any).prompt_text,
              q.answer,
              typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
              q.type || 'multiple_choice',
              q.position || 1,
              q.hint || null,
            ]
          );
        }
      }
    }

    const [asgRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM assignments');
    if (asgRows[0].count === 0) {
      console.log('🌱 Seeding initial Assignments...');
      for (const a of INITIAL_ASSIGNMENTS) {
        await connection.query(
          'INSERT INTO assignments (id, teacher_id, teacher_name, class_id, class_name, question_set_id, question_set_title, game_slug, game_name, join_code, due_date, rewards_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.teacher_id, a.teacher_name, a.class_id, a.class_name, a.question_set_id, a.question_set_title, a.game_slug, a.game_name, a.join_code, a.due_date, a.rewards_enabled, a.created_at]
        );
      }
    }

    const [attRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM attempts');
    if (attRows[0].count === 0) {
      console.log('🌱 Seeding initial Attempts...');
      for (const att of INITIAL_ATTEMPTS) {
        await connection.query(
          'INSERT INTO attempts (id, assignment_id, student_id, student_name, question_set_id, question_set_title, game_slug, score, accuracy, total_questions, correct_count, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [att.id, att.assignment_id, att.student_id, att.student_name, att.question_set_id, att.question_set_title, att.game_slug, att.score, att.accuracy, att.total_questions, att.correct_count, att.completed_at]
        );

        for (const ans of att.answers) {
          await connection.query(
            'INSERT INTO attempt_answers (attempt_id, question_id, question_prompt, student_answer, correct_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
            [att.id, ans.question_id, ans.question_prompt, ans.student_answer, ans.correct_answer, ans.is_correct]
          );
        }
      }
    }

    const [stickerRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM stickers');
    if (stickerRows[0].count === 0) {
      console.log('🌱 Seeding initial Stickers catalog...');
      for (const stk of INITIAL_STICKERS) {
        await connection.query(
          'INSERT INTO stickers (id, name, rarity, category, emoji, description) VALUES (?, ?, ?, ?, ?, ?)',
          [stk.id, stk.name, stk.rarity, stk.category, stk.emoji, stk.description]
        );
      }
    }

    const [rosterRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM roster');
    if (rosterRows[0].count === 0) {
      console.log('🌱 Seeding initial Class Roster...');
      for (const r of INITIAL_ROSTER) {
        await connection.query(
          'INSERT INTO roster (id, name, avatar, stars, points) VALUES (?, ?, ?, ?, ?)',
          [r.id, r.name, r.avatar, r.stars, r.points]
        );
      }
    }

    const [rewardRows] = await connection.query<any[]>('SELECT COUNT(*) as count FROM rewards');
    if (rewardRows[0].count === 0) {
      console.log('🌱 Seeding initial Rewards...');
      for (const rw of INITIAL_REWARDS) {
        await connection.query(
          'INSERT INTO rewards (student_id, points, tickets_earned, unlocked_sticker_ids) VALUES (?, ?, ?, ?)',
          [rw.student_id, rw.points, rw.tickets_earned, rw.unlocked_sticker_ids]
        );
      }
    }

    connection.release();
    console.log('✅ MySQL Database initialization and seeding finished successfully.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  }
}
