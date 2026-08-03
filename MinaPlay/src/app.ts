import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env';
import { createReleaseMetadataLoader } from './services/release-service';

export function createApp(): express.Express {
  const app = express();
  const publicDir = path.join(process.cwd(), 'public');
  const releaseMetadata = createReleaseMetadataLoader({
    sourceUrl: env.RELEASE_METADATA_URL,
    ttlMs: env.RELEASE_METADATA_CACHE_MS
  });

  app.use(morgan('combined'));
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, app: 'MinaPlay' });
  });

  app.get('/api/update', async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      res.status(200).json(await releaseMetadata.load());
    } catch {
      res.status(503).json({
        ok: false,
        message: 'Güvenli MinaPlay sürüm bilgisi şu anda alınamıyor.'
      });
    }
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
