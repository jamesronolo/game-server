import { Router } from 'express';
import { isInMemoryMode } from '../db.js';
import { usersRouter } from './users.routes.js';
import { gamesRouter } from './games.routes.js';
import { questionSetsRouter } from './questionSets.routes.js';
import { assignmentsRouter } from './assignments.routes.js';
import { attemptsRouter } from './attempts.routes.js';
import { stickersRouter } from './stickers.routes.js';
import { rosterRouter } from './roster.routes.js';
import { rewardsRouter } from './rewards.routes.js';
import { aiRouter } from './ai.routes.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: isInMemoryMode ? 'in-memory-fallback' : 'connected',
    timestamp: new Date().toISOString(),
  });
});

// Sub-routes
apiRouter.use('/users', usersRouter);
apiRouter.use('/games', gamesRouter);
apiRouter.use('/question-sets', questionSetsRouter);
apiRouter.use('/assignments', assignmentsRouter);
apiRouter.use('/attempts', attemptsRouter);
apiRouter.use('/stickers', stickersRouter);
apiRouter.use('/roster', rosterRouter);
apiRouter.use('/rewards', rewardsRouter);
apiRouter.use('/ai', aiRouter);
