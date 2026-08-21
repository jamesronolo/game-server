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

    if (upperSql.includes('SELECT 1')) {
      return [[{ test: 1 }] as any, null];
    }

    // 1. Users
    if (upperSql.includes('FROM USERS')) {
      const rows = memoryStore.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isPro: u.is_pro,
        avatarUrl: u.avatar_url,
        className: u.class_name,
      }));
      return [rows as any, null];
    }
    if (upperSql.includes('UPDATE USERS')) {
      if (params && params.length >= 6) {
        const [isPro, name, email, avatarUrl, className, id] = params;
        const u = memoryStore.users.find((x: any) => x.id === id);
        if (u) {
          if (isPro !== null && isPro !== undefined) u.is_pro = Boolean(isPro);
          if (name) u.name = name;
          if (email) u.email = email;
          if (avatarUrl) u.avatar_url = avatarUrl;
          if (className) u.class_name = className;
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    // 2. Games
    if (upperSql.includes('FROM GAMES')) {
      const rows = memoryStore.games.map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        mechanic: g.mechanic,
        badge: g.badge,
        category: g.category,
        minGrade: g.min_grade,
        iconName: g.icon_name,
        gradientBg: g.gradient_bg,
        accentColor: g.accent_color,
        imageUrl: g.image_url,
      }));
      return [rows as any, null];
    }

    // 3. Question Sets
    if (upperSql.includes('FROM QUESTION_SETS')) {
      if (upperSql.includes('WHERE ID = ?')) {
        const set = memoryStore.questionSets.find((s: any) => s.id === params?.[0]);
        return [(set ? [set] : []) as any, null];
      }
      return [memoryStore.questionSets as any, null];
    }

    if (upperSql.includes('FROM QUESTIONS WHERE SET_ID = ?')) {
      const set = memoryStore.questionSets.find((s: any) => s.id === params?.[0]);
      return [(set ? set.questions : []) as any, null];
    }

    if (upperSql.includes('INSERT INTO QUESTION_SETS')) {
      if (params && params.length >= 11) {
        const [id, ownerId, ownerName, title, description, subject, gradeLevel, isPublic, tagsJson, createdAt, updatedAt] = params;
        const existingIdx = memoryStore.questionSets.findIndex((s: any) => s.id === id);
        const newSet = {
          id,
          ownerId,
          ownerName,
          title,
          description,
          subject,
          gradeLevel,
          isPublic: Boolean(isPublic),
          tags: tagsJson,
          createdAt,
          updatedAt,
          questions: [],
        };
        if (existingIdx >= 0) {
          memoryStore.questionSets[existingIdx] = newSet;
        } else {
          memoryStore.questionSets.unshift(newSet);
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('UPDATE QUESTION_SETS')) {
      if (params && params.length >= 8) {
        const [title, description, subject, gradeLevel, isPublic, tagsJson, updatedAt, id] = params;
        const set = memoryStore.questionSets.find((s: any) => s.id === id);
        if (set) {
          set.title = title;
          set.description = description;
          set.subject = subject;
          set.gradeLevel = gradeLevel;
          set.isPublic = Boolean(isPublic);
          set.tags = tagsJson;
          set.updatedAt = updatedAt;
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('DELETE FROM QUESTIONS WHERE SET_ID = ?')) {
      const set = memoryStore.questionSets.find((s: any) => s.id === params?.[0]);
      if (set) set.questions = [];
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('INSERT INTO QUESTIONS')) {
      if (params && params.length >= 8) {
        const [id, set_id, promptText, answer, optionsJson, type, position, hint] = params;
        const set = memoryStore.questionSets.find((s: any) => s.id === set_id);
        if (set) {
          set.questions.push({
            id,
            promptText,
            answer,
            options: optionsJson,
            type: type || 'multiple_choice',
            position: position || 1,
            hint: hint || null,
          });
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('DELETE FROM QUESTION_SETS WHERE ID = ?')) {
      const id = params?.[0];
      const idx = memoryStore.questionSets.findIndex((s: any) => s.id === id);
      if (idx >= 0) memoryStore.questionSets.splice(idx, 1);
      return [{ affectedRows: 1 } as any, null];
    }

    // 4. Assignments
    if (upperSql.includes('FROM ASSIGNMENTS')) {
      const rows = memoryStore.assignments.map((a: any) => ({
        id: a.id,
        teacherId: a.teacher_id || a.teacherId,
        teacherName: a.teacher_name || a.teacherName,
        classId: a.class_id || a.classId,
        className: a.class_name || a.className,
        questionSetId: a.question_set_id || a.questionSetId,
        questionSetTitle: a.question_set_title || a.questionSetTitle,
        gameSlug: a.game_slug || a.gameSlug,
        gameName: a.game_name || a.gameName,
        joinCode: a.join_code || a.joinCode,
        dueDate: a.due_date || a.dueDate,
        rewardsEnabled: Boolean(a.rewards_enabled ?? a.rewardsEnabled),
        createdAt: a.created_at || a.createdAt,
      }));
      return [rows as any, null];
    }

    if (upperSql.includes('INSERT INTO ASSIGNMENTS')) {
      if (params && params.length >= 13) {
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
        });
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('DELETE FROM ASSIGNMENTS WHERE ID = ?')) {
      const id = params?.[0];
      const idx = memoryStore.assignments.findIndex((a: any) => a.id === id);
      if (idx >= 0) memoryStore.assignments.splice(idx, 1);
      return [{ affectedRows: 1 } as any, null];
    }

    // 5. Attempts
    if (upperSql.includes('FROM ATTEMPTS')) {
      const rows = memoryStore.attempts.map((att: any) => ({
        id: att.id,
        assignmentId: att.assignment_id || att.assignmentId,
        studentId: att.student_id || att.studentId,
        studentName: att.student_name || att.studentName,
        questionSetId: att.question_set_id || att.questionSetId,
        questionSetTitle: att.question_set_title || att.questionSetTitle,
        gameSlug: att.game_slug || att.gameSlug,
        score: att.score,
        accuracy: att.accuracy,
        totalQuestions: att.total_questions || att.totalQuestions,
        correctCount: att.correct_count || att.correctCount,
        completedAt: att.completed_at || att.completedAt,
      }));
      return [rows as any, null];
    }

    if (upperSql.includes('FROM ATTEMPT_ANSWERS WHERE ATTEMPT_ID = ?')) {
      const att = memoryStore.attempts.find((a: any) => a.id === params?.[0]);
      return [(att ? (att.answers || []).map((ans: any) => ({
        questionId: ans.question_id || ans.questionId,
        questionPrompt: ans.question_prompt || ans.questionPrompt,
        studentAnswer: ans.student_answer || ans.studentAnswer,
        correctAnswer: ans.correct_answer || ans.correctAnswer,
        isCorrect: Boolean(ans.is_correct ?? ans.isCorrect),
      })) : []) as any, null];
    }

    if (upperSql.includes('INSERT INTO ATTEMPTS')) {
      if (params && params.length >= 12) {
        const [id, assignmentId, studentId, studentName, questionSetId, questionSetTitle, gameSlug, score, accuracy, totalQuestions, correctCount, completedAt] = params;
        memoryStore.attempts.unshift({
          id,
          assignment_id: assignmentId,
          student_id: studentId,
          student_name: studentName,
          question_set_id: questionSetId,
          question_set_title: questionSetTitle,
          game_slug: gameSlug,
          score,
          accuracy,
          total_questions: totalQuestions,
          correct_count: correctCount,
          completed_at: completedAt,
          answers: [],
        });
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('INSERT INTO ATTEMPT_ANSWERS')) {
      if (params && params.length >= 6) {
        const [attemptId, questionId, questionPrompt, studentAnswer, correctAnswer, isCorrect] = params;
        const att = memoryStore.attempts.find((a: any) => a.id === attemptId);
        if (att) {
          if (!att.answers) att.answers = [];
          att.answers.push({
            question_id: questionId,
            question_prompt: questionPrompt,
            student_answer: studentAnswer,
            correct_answer: correctAnswer,
            is_correct: Boolean(isCorrect),
          });
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    // 6. Stickers
    if (upperSql.includes('FROM STICKERS')) {
      return [memoryStore.stickers as any, null];
    }

    // 7. Roster
    if (upperSql.includes('FROM ROSTER')) {
      return [memoryStore.roster as any, null];
    }

    if (upperSql.includes('INSERT INTO ROSTER')) {
      if (params && params.length >= 5) {
        const [id, name, avatar, stars, points] = params;
        memoryStore.roster.push({ id, name, avatar, stars: stars || 0, points: points || 0 });
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('UPDATE ROSTER')) {
      if (params && params.length >= 5) {
        const [name, avatar, stars, points, id] = params;
        const student = memoryStore.roster.find((r: any) => r.id === id);
        if (student) {
          if (name) student.name = name;
          if (avatar) student.avatar = avatar;
          if (stars !== null && stars !== undefined) student.stars = stars;
          if (points !== null && points !== undefined) student.points = points;
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('DELETE FROM ROSTER WHERE ID = ?')) {
      const id = params?.[0];
      const idx = memoryStore.roster.findIndex((r: any) => r.id === id);
      if (idx >= 0) memoryStore.roster.splice(idx, 1);
      return [{ affectedRows: 1 } as any, null];
    }

    // 8. Rewards
    if (upperSql.includes('FROM REWARDS WHERE STUDENT_ID = ?')) {
      const rw: any = memoryStore.rewards.find((r: any) => (r.student_id || r.studentId) === params?.[0]);
      return [(rw ? [{
        studentId: rw.student_id || rw.studentId,
        points: rw.points,
        ticketsEarned: rw.tickets_earned || rw.ticketsEarned,
        unlockedStickerIds: rw.unlocked_sticker_ids || rw.unlockedStickerIds,
      }] : []) as any, null];
    }

    if (upperSql.includes('UPDATE REWARDS')) {
      if (params && params.length >= 4) {
        const [points, ticketsEarned, stickerJson, studentId] = params;
        const rw = memoryStore.rewards.find((r: any) => (r.student_id || r.studentId) === studentId);
        if (rw) {
          if (points !== null && points !== undefined) rw.points = points;
          if (ticketsEarned !== null && ticketsEarned !== undefined) rw.tickets_earned = ticketsEarned;
          rw.unlocked_sticker_ids = stickerJson;
        }
      }
      return [{ affectedRows: 1 } as any, null];
    }

    if (upperSql.includes('INSERT INTO REWARDS')) {
      if (params && params.length >= 4) {
        const [studentId, points, ticketsEarned, stickerJson] = params;
        memoryStore.rewards.push({
          student_id: studentId,
          points: points || 0,
          tickets_earned: ticketsEarned || 0,
          unlocked_sticker_ids: stickerJson,
        });
      }
      return [{ affectedRows: 1 } as any, null];
    }

    // 9. Programming Quiz Questions
    if (upperSql.includes('FROM PROGRAMMING_QUIZ_QUESTIONS')) {
      return [memoryStore.programmingQuestions as any, null];
    }

    // 10. Programming Quiz Attempts
    if (upperSql.includes('FROM PROGRAMMING_QUIZ_ATTEMPTS')) {
      return [memoryStore.programmingAttempts as any, null];
    }

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

    return [[] as any, null];
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
    const connection = await Promise.race([
      mysqlPool.getConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1500)),
    ]) as any;

    await connection.query('SET NAMES utf8mb4');
    connection.release();
    console.log('✅ Connected to MySQL database successfully.');
  } catch (err) {
    console.log('⚠️ Local MySQL instance not available on port 3306. Switching to Zero-Config In-Memory Mode.');
    isInMemoryMode = true;
  }
}
