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

export let isInMemoryMode = false;

let mysqlPool: any = null;

try {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'games',
    password: process.env.DB_PASSWORD || 'games',
    database: process.env.DB_NAME || 'games',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 2000,
  });
} catch (err) {
  console.log('⚠️ Could not initialize MySQL pool:', err);
}

// ----- Programming Quiz Seed Data -----
const PROGRAMMING_QUIZ_QUESTIONS = [
  { id: 'pq1', number: 1, question: 'What does HTML stand for?', options: ['Hyper Trainer Marking Language','Hyper Text Markup Language','High Text Machine Language','Hyperlink Text Management Language'], correctOption: 'B', explanation: 'HTML stands for HyperText Markup Language, the standard markup language for creating web pages.' },
  { id: 'pq2', number: 2, question: 'What does CSS stand for?', options: ['Creative Style Sheets','Computer Style Sheets','Cascading Style Sheets','Colorful Style Sheets'], correctOption: 'C', explanation: 'CSS stands for Cascading Style Sheets, used to style and layout web pages.' },
  { id: 'pq3', number: 3, question: 'What does PHP stand for?', options: ['Personal Home Page','Private Hosting Program','PHP: Hypertext Preprocessor','Programmed Hyperlink Page'], correctOption: 'C', explanation: 'PHP: Hypertext Preprocessor is a server-side scripting language for web development.' },
  { id: 'pq4', number: 4, question: 'What does SQL stand for?', options: ['Structured Question Language','Structured Query Language','Simple Query Logic','System Query Language'], correctOption: 'B', explanation: 'SQL stands for Structured Query Language, used to manage and query relational databases.' },
  { id: 'pq5', number: 5, question: 'What is the main purpose of CSS?', options: ['To create databases','To style and design web pages','To handle server-side logic','To store data'], correctOption: 'B', explanation: 'CSS is used to style and design web pages — controlling colors, fonts, spacing, layout, and more.' },
  { id: 'pq6', number: 6, question: 'What is the main purpose of HTML?', options: ['To style web pages','To structure the content of a web page','To run programs on a computer','To manage databases'], correctOption: 'B', explanation: 'HTML is used to structure the content of a web page, defining headings, paragraphs, links, images, etc.' },
  { id: 'pq7', number: 7, question: 'What does JS stand for?', options: ['Java Syntax','JavaScript','Joint Script','Java Source'], correctOption: 'B', explanation: 'JS stands for JavaScript, a popular programming language for web interactivity.' },
  { id: 'pq8', number: 8, question: 'Which of the following is a programming language used mainly for web development on the server side?', options: ['HTML','CSS','PHP','SVG'], correctOption: 'C', explanation: 'PHP is a server-side scripting language widely used for web development.' },
  { id: 'pq9', number: 9, question: 'What does API stand for?', options: ['Application Programming Interface','Advanced Program Integration','Application Process Index','Automated Programming Instruction'], correctOption: 'A', explanation: 'API stands for Application Programming Interface — a way for different software to communicate.' },
  { id: 'pq10', number: 10, question: 'What is a "variable" in programming?', options: ['A fixed value that never changes','A container used to store data values','A type of programming language','A software installation file'], correctOption: 'B', explanation: 'A variable is a named container used to store data values that can change during program execution.' },
  { id: 'pq11', number: 11, question: 'What does IDE stand for?', options: ['Integrated Development Environment','Internal Data Engine','Interactive Design Editor','Integrated Design Element'], correctOption: 'A', explanation: 'IDE stands for Integrated Development Environment — a software application that provides tools for writing code.' },
  { id: 'pq12', number: 12, question: 'Which symbol is commonly used to start a comment in Python?', options: ['//','#','<!--','/*'], correctOption: 'B', explanation: 'In Python, the # symbol is used to start a single-line comment.' },
  { id: 'pq13', number: 13, question: 'What is a "function" in programming?', options: ['A type of computer virus','A reusable block of code that performs a specific task','A file format','A database table'], correctOption: 'B', explanation: 'A function is a reusable block of code designed to perform a specific task when called.' },
  { id: 'pq14', number: 14, question: 'What does "debugging" mean?', options: ['Writing new code from scratch','Designing the layout of a website','Finding and fixing errors in code','Deleting a program completely'], correctOption: 'C', explanation: 'Debugging is the process of finding and fixing errors (bugs) in a computer program.' },
  { id: 'pq15', number: 15, question: 'Which of these is NOT a programming language?', options: ['Python','Java','HTML','Photoshop'], correctOption: 'D', explanation: 'Photoshop is a graphic design tool, not a programming language. HTML is a markup language (not traditionally called a programming language), but Photoshop is definitively not one.' },
  { id: 'pq16', number: 16, question: 'What does "URL" stand for?', options: ['Universal Resource Locator','Uniform Resource Locator','United Resource Link','Universal Reference Link'], correctOption: 'B', explanation: 'URL stands for Uniform Resource Locator, the address used to access resources on the internet.' },
  { id: 'pq17', number: 17, question: 'What is an "array" used for in programming?', options: ['To store a single value','To style a webpage','To store multiple values in one variable','To connect to the internet'], correctOption: 'C', explanation: 'An array is a data structure that stores multiple values in a single variable.' },
  { id: 'pq18', number: 18, question: 'What does "loop" mean in programming?', options: ['A way to store data permanently','A structure that repeats a block of code','A type of error','A design pattern for websites'], correctOption: 'B', explanation: 'A loop is a control structure that repeats a block of code until a specified condition is met.' },
  { id: 'pq19', number: 19, question: 'Which of the following is used to create databases and manage data?', options: ['HTML','SQL','CSS','JS'], correctOption: 'B', explanation: 'SQL (Structured Query Language) is used to create and manage databases.' },
  { id: 'pq20', number: 20, question: 'What is the file extension for a Python file?', options: ['.py','.java','.html','.exe'], correctOption: 'A', explanation: 'Python files use the .py extension.' },
  { id: 'pq21', number: 21, question: 'What does "syntax error" mean?', options: ['The program runs too slowly','The code violates the rules of the programming language','The program uses too much memory','The internet connection failed'], correctOption: 'B', explanation: 'A syntax error occurs when code violates the grammar rules of the programming language.' },
  { id: 'pq22', number: 22, question: 'What is the purpose of an "if statement" in programming?', options: ['To repeat code multiple times','To make decisions based on conditions','To style a webpage','To store data in a database'], correctOption: 'B', explanation: 'An if statement is used to execute code only when a specific condition is true — it enables decision-making.' },
  { id: 'pq23', number: 23, question: 'What does "OOP" stand for?', options: ['Object-Oriented Programming','Open-Output Programming','Online Operating Protocol','Optimal Operation Process'], correctOption: 'A', explanation: 'OOP stands for Object-Oriented Programming, a paradigm based on objects and classes.' },
  { id: 'pq24', number: 24, question: 'What is a "compiler" used for?', options: ['To design website layouts','To translate source code into machine code','To store files in the cloud','To connect to a database'], correctOption: 'B', explanation: 'A compiler translates high-level source code into machine code that a computer can execute.' },
  { id: 'pq25', number: 25, question: 'Which of these is a popular version control system used by programmers?', options: ['Git','Word','Excel','Photoshop'], correctOption: 'A', explanation: 'Git is the most widely used distributed version control system for tracking code changes.' },
];

export const memoryStore = {
  users: [...INITIAL_USERS],
  games: [...INITIAL_GAMES],
  questionSets: JSON.parse(JSON.stringify(INITIAL_QUESTION_SETS)),
  assignments: [...INITIAL_ASSIGNMENTS],
  attempts: JSON.parse(JSON.stringify(INITIAL_ATTEMPTS)),
  stickers: [...INITIAL_STICKERS],
  roster: [...INITIAL_ROSTER],
  rewards: [...INITIAL_REWARDS],
  programmingQuestions: [...PROGRAMMING_QUIZ_QUESTIONS],
  programmingAttempts: [] as any[],
};

/**
 * Execute a MySQL Stored Procedure with parameters
 * Automatically handles MySQL results or in-memory fallback
 */
export async function callProcedure<T = any>(procName: string, params: any[] = []): Promise<T> {
  if (!isInMemoryMode && mysqlPool) {
    try {
      const placeholders = params.map(() => '?').join(', ');
      const sql = `CALL ${procName}(${placeholders})`;
      const [results] = (await mysqlPool.query(sql, params)) as any[];
      // MySQL stored procedures return an array of result sets; first item is our procedure's SELECT
      if (Array.isArray(results) && results.length > 0) {
        return results[0] as T;
      }
      return results as T;
    } catch (err) {
      console.warn(`⚠️ MySQL error executing ${procName}, using in-memory store fallback:`, (err as Error).message);
      isInMemoryMode = true;
    }
  }

  // In-memory procedure handlers for offline/testing fallback
  return executeInMemoryProcedure<T>(procName, params);
}

function executeInMemoryProcedure<T>(procName: string, params: any[]): T {
  const name = procName.toLowerCase();

  switch (name) {
    case 'sp_get_users':
      return memoryStore.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isPro: Boolean(u.is_pro ?? u.isPro),
        avatarUrl: u.avatar_url ?? u.avatarUrl,
        className: u.class_name ?? u.className,
        createdAt: u.created_at ?? u.createdAt,
      })) as unknown as T;

    case 'sp_update_user': {
      const [id, nameVal, email, isPro, avatarUrl, className] = params;
      const u = memoryStore.users.find((x: any) => x.id === id);
      if (u) {
        if (nameVal !== null && nameVal !== undefined) u.name = nameVal;
        if (email !== null && email !== undefined) u.email = email;
        if (isPro !== null && isPro !== undefined) u.is_pro = Boolean(isPro);
        if (avatarUrl !== null && avatarUrl !== undefined) u.avatar_url = avatarUrl;
        if (className !== null && className !== undefined) u.class_name = className;
      }
      return [{ affected_rows: u ? 1 : 0 }] as unknown as T;
    }

    case 'sp_get_games':
      return memoryStore.games.map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        mechanic: g.mechanic,
        badge: g.badge,
        category: g.category,
        minGrade: g.min_grade ?? g.minGrade,
        iconName: g.icon_name ?? g.iconName,
        gradientBg: g.gradient_bg ?? g.gradientBg,
        accentColor: g.accent_color ?? g.accentColor,
        imageUrl: g.image_url ?? g.imageUrl,
      })) as unknown as T;

    case 'sp_get_question_sets':
      return memoryStore.questionSets.map((s: any) => ({
        id: s.id,
        ownerId: s.owner_id ?? s.ownerId,
        ownerName: s.owner_name ?? s.ownerName,
        title: s.title,
        description: s.description,
        subject: s.subject,
        gradeLevel: s.grade_level ?? s.gradeLevel,
        isPublic: Boolean(s.is_public ?? s.isPublic),
        tags: s.tags,
        createdAt: s.created_at ?? s.createdAt,
        updatedAt: s.updated_at ?? s.updatedAt,
      })) as unknown as T;

    case 'sp_get_question_set_by_id': {
      const [id] = params;
      const set = memoryStore.questionSets.find((s: any) => s.id === id);
      return (set ? [set] : []) as unknown as T;
    }

    case 'sp_get_questions_by_set_id': {
      const [setId] = params;
      const set = memoryStore.questionSets.find((s: any) => s.id === setId);
      return (set?.questions || []).map((q: any, i: number) => ({
        id: q.id,
        setId,
        promptText: q.prompt_text ?? q.promptText,
        answer: q.answer,
        options: q.options,
        type: q.type || 'multiple_choice',
        position: q.position ?? i + 1,
        hint: q.hint || null,
      })) as unknown as T;
    }

    case 'sp_upsert_question_set': {
      const [id, ownerId, ownerName, title, description, subject, gradeLevel, isPublic, tags, createdAt, updatedAt] = params;
      const existingIdx = memoryStore.questionSets.findIndex((s: any) => s.id === id);
      const setObj = {
        id,
        ownerId,
        ownerName,
        title,
        description,
        subject,
        gradeLevel,
        isPublic: Boolean(isPublic),
        tags,
        createdAt,
        updatedAt,
        questions: existingIdx >= 0 ? memoryStore.questionSets[existingIdx].questions : [],
      };
      if (existingIdx >= 0) {
        memoryStore.questionSets[existingIdx] = setObj;
      } else {
        memoryStore.questionSets.unshift(setObj);
      }
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_delete_questions_by_set_id': {
      const [setId] = params;
      const set = memoryStore.questionSets.find((s: any) => s.id === setId);
      if (set) set.questions = [];
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_insert_question': {
      const [id, setId, promptText, answer, options, type, position, hint] = params;
      const set = memoryStore.questionSets.find((s: any) => s.id === setId);
      if (set) {
        if (!set.questions) set.questions = [];
        set.questions.push({
          id,
          setId,
          promptText,
          answer,
          options,
          type,
          position,
          hint,
        });
      }
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_delete_question_set': {
      const [id] = params;
      const idx = memoryStore.questionSets.findIndex((s: any) => s.id === id);
      if (idx >= 0) memoryStore.questionSets.splice(idx, 1);
      return [{ affected_rows: idx >= 0 ? 1 : 0 }] as unknown as T;
    }

    case 'sp_get_assignments':
      return memoryStore.assignments.map((a: any) => ({
        id: a.id,
        teacherId: a.teacher_id ?? a.teacherId,
        teacherName: a.teacher_name ?? a.teacherName,
        classId: a.class_id ?? a.classId,
        className: a.class_name ?? a.className,
        questionSetId: a.question_set_id ?? a.questionSetId,
        questionSetTitle: a.question_set_title ?? a.questionSetTitle,
        gameSlug: a.game_slug ?? a.gameSlug,
        gameName: a.game_name ?? a.gameName,
        joinCode: a.join_code ?? a.joinCode,
        dueDate: a.due_date ?? a.dueDate,
        rewardsEnabled: Boolean(a.rewards_enabled ?? a.rewardsEnabled),
        createdAt: a.created_at ?? a.createdAt,
      })) as unknown as T;

    case 'sp_create_assignment': {
      const [id, teacherId, teacherName, classId, className, questionSetId, questionSetTitle, gameSlug, gameName, joinCode, dueDate, rewardsEnabled, createdAt] = params;
      memoryStore.assignments.unshift({
        id,
        teacher_id: teacherId,
        teacher_name: teacherName,
        class_id: classId,
        class_name: className,
        question_set_id: questionSetId,
        question_set_title: questionSetTitle,
        game_slug: gameSlug,
        game_name: gameName,
        join_code: joinCode,
        due_date: dueDate,
        rewards_enabled: Boolean(rewardsEnabled),
        created_at: createdAt,
      } as any);
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_delete_assignment': {
      const [id] = params;
      const idx = memoryStore.assignments.findIndex((a: any) => a.id === id);
      if (idx >= 0) memoryStore.assignments.splice(idx, 1);
      return [{ affected_rows: idx >= 0 ? 1 : 0 }] as unknown as T;
    }

    case 'sp_get_attempts':
      return memoryStore.attempts.map((att: any) => ({
        id: att.id,
        assignmentId: att.assignment_id ?? att.assignmentId,
        studentId: att.student_id ?? att.studentId,
        studentName: att.student_name ?? att.studentName,
        questionSetId: att.question_set_id ?? att.questionSetId,
        questionSetTitle: att.question_set_title ?? att.questionSetTitle,
        gameSlug: att.game_slug ?? att.gameSlug,
        score: att.score ?? 0,
        accuracy: att.accuracy ?? 0,
        totalQuestions: att.total_questions ?? att.totalQuestions ?? 0,
        correctCount: att.correct_count ?? att.correctCount ?? 0,
        completedAt: att.completed_at ?? att.completedAt,
      })) as unknown as T;

    case 'sp_get_attempt_answers': {
      const [attemptId] = params;
      const att = memoryStore.attempts.find((a: any) => a.id === attemptId);
      return (att?.answers || []).map((ans: any) => ({
        questionId: ans.question_id ?? ans.questionId,
        questionPrompt: ans.question_prompt ?? ans.questionPrompt,
        studentAnswer: ans.student_answer ?? ans.studentAnswer,
        correctAnswer: ans.correct_answer ?? ans.correctAnswer,
        isCorrect: Boolean(ans.is_correct ?? ans.isCorrect),
      })) as unknown as T;
    }

    case 'sp_record_attempt': {
      const [id, assignmentId, studentId, studentName, questionSetId, questionSetTitle, gameSlug, score, accuracy, totalQuestions, correctCount, completedAt] = params;
      memoryStore.attempts.unshift({
        id,
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
        completedAt,
        answers: [],
      });
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_add_attempt_answer': {
      const [attemptId, questionId, questionPrompt, studentAnswer, correctAnswer, isCorrect] = params;
      const att = memoryStore.attempts.find((a: any) => a.id === attemptId);
      if (att) {
        if (!att.answers) att.answers = [];
        att.answers.push({
          questionId,
          questionPrompt,
          studentAnswer,
          correctAnswer,
          isCorrect: Boolean(isCorrect),
        });
      }
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_get_stickers':
      return memoryStore.stickers.map((s: any) => ({
        id: s.id,
        name: s.name,
        rarity: s.rarity,
        category: s.category,
        emoji: s.emoji,
        description: s.description,
      })) as unknown as T;

    case 'sp_get_roster':
      return memoryStore.roster.map((r: any) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        stars: r.stars ?? 0,
        points: r.points ?? 0,
      })) as unknown as T;

    case 'sp_add_student': {
      const [id, nameVal, avatar] = params;
      memoryStore.roster.push({
        id,
        name: nameVal,
        avatar: avatar || '🧑',
        stars: 0,
        points: 0,
      });
      return [{ affected_rows: 1 }] as unknown as T;
    }

    case 'sp_update_student': {
      const [id, nameVal, avatar, stars, points] = params;
      const student = memoryStore.roster.find((r: any) => r.id === id);
      if (student) {
        if (nameVal !== null && nameVal !== undefined) student.name = nameVal;
        if (avatar !== null && avatar !== undefined) student.avatar = avatar;
        if (stars !== null && stars !== undefined) student.stars = stars;
        if (points !== null && points !== undefined) student.points = points;
      }
      return [{ affected_rows: student ? 1 : 0 }] as unknown as T;
    }

    case 'sp_delete_student': {
      const [id] = params;
      const idx = memoryStore.roster.findIndex((r: any) => r.id === id);
      if (idx >= 0) memoryStore.roster.splice(idx, 1);
      return [{ affected_rows: idx >= 0 ? 1 : 0 }] as unknown as T;
    }

    case 'sp_get_rewards': {
      const [studentId] = params;
      const rw: any = memoryStore.rewards.find((r: any) => (r.student_id || r.studentId) === studentId);
      if (!rw) return [] as unknown as T;
      return [{
        studentId: rw.student_id ?? rw.studentId,
        points: rw.points,
        ticketsEarned: rw.tickets_earned ?? rw.ticketsEarned,
        unlockedStickerIds: rw.unlocked_sticker_ids ?? rw.unlockedStickerIds,
      }] as unknown as T;
    }

    case 'sp_update_rewards': {
      const [studentId, points, ticketsEarned, unlockedStickerIds] = params;
      const rw: any = memoryStore.rewards.find((r: any) => (r.student_id || r.studentId) === studentId);
      if (rw) {
        if (points !== null && points !== undefined) rw.points = points;
        if (ticketsEarned !== null && ticketsEarned !== undefined) rw.tickets_earned = ticketsEarned;
        if (unlockedStickerIds !== null && unlockedStickerIds !== undefined) rw.unlocked_sticker_ids = unlockedStickerIds;
      } else {
        memoryStore.rewards.push({
          student_id: studentId,
          points: points || 0,
          tickets_earned: ticketsEarned || 0,
          unlocked_sticker_ids: unlockedStickerIds || '["stk-1","stk-2"]',
        });
      }
      return [{ affected_rows: 1 }] as unknown as T;
    }

    default:
      console.warn(`Unknown stored procedure called: ${procName}`);
      return [] as unknown as T;
  }
}

export const pool = {
  async query<T = any>(sql: string, params?: any[]): Promise<[T, any]> {
    if (!isInMemoryMode && mysqlPool) {
      try {
        return (await mysqlPool.query(sql, params)) as [T, any];
      } catch (err) {
        console.warn('⚠️ MySQL query error, using in-memory store fallback:', (err as Error).message);
        isInMemoryMode = true;
      }
    }

    const upperSql = sql.trim().toUpperCase();

    // Programming Quiz Questions Query
    if (upperSql.includes('PROGRAMMING_QUIZ_QUESTIONS')) {
      return [memoryStore.programmingQuestions as any, null];
    }

    // Programming Quiz Attempts Query
    if (upperSql.includes('INSERT INTO PROGRAMMING_QUIZ_ATTEMPTS')) {
      if (params && params.length >= 7) {
        const [id, studentName, score, accuracy, totalQuestions, correctCount, completedAt, answersJson] = params;
        memoryStore.programmingAttempts.unshift({
          id,
          studentName,
          score,
          accuracy,
          totalQuestions,
          correctCount,
          completedAt,
          answers: answersJson,
        });
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('PROGRAMMING_QUIZ_ATTEMPTS')) {
      return [memoryStore.programmingAttempts as any, null];
    }

    return [[{ test: 1 }] as any, null];
  },
};

export async function initDatabase() {
  console.log('🔄 Initializing EduPlay database connection...');

  if (!mysqlPool) {
    console.log('💡 Running in Zero-Config In-Memory Mode (Pre-seeded with EduPlay sample data).');
    isInMemoryMode = true;
    return;
  }

  try {
    const connection = (await Promise.race([
      mysqlPool.getConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1500)),
    ])) as any;

    await connection.query('SET NAMES utf8mb4');
    connection.release();
    console.log('✅ Connected to MySQL database successfully.');
  } catch (err) {
    console.log('⚠️ Local MySQL instance not available on port 3306. Switching to Zero-Config In-Memory Mode.');
    isInMemoryMode = true;
  }
}
