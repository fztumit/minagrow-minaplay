import express from 'express';
import morgan from 'morgan';
import { Env } from './config/env';
import { buildWebhookRouter } from './routes/webhooks';
import { ZohoService } from './services/zoho';

export function createApp(env: Env): express.Express {
  const app = express();

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as any).rawBody = Buffer.from(buf);
      }
    })
  );

  app.use(morgan('combined'));

  const zoho = new ZohoService(env);
  app.use('/webhooks', buildWebhookRouter(env, zoho));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}
