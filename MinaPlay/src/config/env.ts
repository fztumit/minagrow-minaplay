import dotenv from 'dotenv';

dotenv.config();

export type Env = {
  PORT: number;
};

function readPort(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

export const env: Env = {
  PORT: readPort(process.env.PORT)
};
