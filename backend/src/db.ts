import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { memoryStore, executeInMemoryProcedure } from './db/inMemoryHandlers.js';
import { verifyAndMigrateSchema } from './db/schema.js';

dotenv.config();

export { memoryStore };
export let isInMemoryMode = false;

let mysqlPool: mysql.Pool | null = null;

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
    } catch (err: any) {
      console.warn(`⚠️ MySQL error executing ${procName}, using in-memory store fallback:`, err.message);
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'PROTOCOL_CONNECTION_LOST' ||
        err.message?.includes('Connection timeout')
      ) {
        isInMemoryMode = true;
      }
    }
  }

  // In-memory procedure handlers for offline/testing fallback
  return executeInMemoryProcedure<T>(procName, params);
}

/**
 * Compatibility query dispatcher for direct SQL queries with in-memory fallback
 */
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

/**
 * Initialize database connection and run schema migrations or switch to fallback
 */
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
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2500)),
    ])) as mysql.PoolConnection;

    await verifyAndMigrateSchema(connection);

    connection.release();
    console.log('✅ Connected to MySQL database and verified all schema tables.');
  } catch (err) {
    console.log(
      '⚠️ Local MySQL instance not available on port 3306 or error initializing. Switching to Zero-Config In-Memory Mode:',
      (err as Error).message
    );
    isInMemoryMode = true;
  }
}
