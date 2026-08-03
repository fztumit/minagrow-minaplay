import dotenv from 'dotenv';

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT ?? '3100', 10);

export const env = {
  HOST: process.env.HOST ?? '0.0.0.0',
  PORT: Number.isFinite(parsedPort) ? parsedPort : 3100,
  APK_DOWNLOAD_URL: process.env.APK_DOWNLOAD_URL ?? ''
};
