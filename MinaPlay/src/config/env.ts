import dotenv from 'dotenv';

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT ?? '3100', 10);
const parsedReleaseCacheMs = Number.parseInt(process.env.RELEASE_METADATA_CACHE_MS ?? '300000', 10);

export const env = {
  HOST: process.env.HOST ?? '0.0.0.0',
  PORT: Number.isFinite(parsedPort) ? parsedPort : 3100,
  RELEASE_METADATA_URL:
    process.env.RELEASE_METADATA_URL
    ?? 'https://github.com/fztumit/minagrow-minaplay/releases/latest/download/minaplay-release.json',
  RELEASE_METADATA_CACHE_MS: Number.isFinite(parsedReleaseCacheMs) ? Math.max(0, parsedReleaseCacheMs) : 300_000
};
