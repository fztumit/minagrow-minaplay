import dotenv from 'dotenv';

dotenv.config();

const parsedPort = Number.parseInt(process.env.PORT ?? '3100', 10);

export const env = {
  PORT: Number.isFinite(parsedPort) ? parsedPort : 3100
};
