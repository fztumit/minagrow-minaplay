import express from 'express';
import morgan from 'morgan';
import path from 'node:path';

export function createApp(): express.Express {
  const app = express();
  const publicDir = path.join(process.cwd(), 'public');

  app.use(morgan('combined'));
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, app: 'MinaPlay' });
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
