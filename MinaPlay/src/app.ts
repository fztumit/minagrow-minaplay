import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { Env } from './config/env';

export function createApp(env: Env): express.Express {
  const app = express();

  app.use(morgan('combined'));

  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, app: 'MinaPlay', port: env.PORT });
  });

  return app;
}
