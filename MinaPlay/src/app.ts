import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env';

export function createApp(): express.Express {
  const app = express();
  const publicDir = path.join(process.cwd(), 'public');
  const debugApkPath = path.join(process.cwd(), 'android/app/build/outputs/apk/debug/app-debug.apk');

  app.use(morgan('combined'));
  app.use(express.static(publicDir));

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, app: 'MinaPlay' });
  });

  app.get('/api/update', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ version: '1.0.35', versionCode: 36, apkUrl: '/downloads/minaplay-latest.apk' });
  });

  function sendDebugApk(res: express.Response, fileName: string) {
    if (fs.existsSync(debugApkPath)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.download(debugApkPath, fileName);
      return true;
    }

    return false;
  }

  app.get('/downloads/minaplay-latest.apk', (_req, res) => {
    if (sendDebugApk(res, 'minaplay-latest.apk')) {
      return;
    }

    if (env.APK_DOWNLOAD_URL) {
      res.redirect(302, env.APK_DOWNLOAD_URL);
      return;
    }

    res.status(404).json({
      ok: false,
      message: 'APK indirme dosyası henüz bu sunucuda yayınlanmadı. APK_DOWNLOAD_URL ayarlanmalı veya APK dosyası sunucuya eklenmeli.'
    });
  });

  app.get('/downloads/:apkName', (req, res, next) => {
    const apkName = req.params.apkName;
    if (!/^minaplay-v\d+\.\d+\.\d+\.apk$/.test(apkName)) {
      next();
      return;
    }

    if (sendDebugApk(res, apkName)) {
      return;
    }

    res.status(404).json({
      ok: false,
      message: 'APK indirme dosyası henüz bu sunucuda yayınlanmadı.'
    });
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
