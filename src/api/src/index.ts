import 'express-async-errors';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { logger } from './logger';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { gamesRouter } from './routes/games';
import { matchmakingRouter } from './routes/matchmaking';
import { errorHandler } from './middleware/error-handler';
import { createSocketServer } from './socket';

// Register game engines
import './engines/gomoku';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/matchmaking', matchmakingRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});
