import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  META_VERIFY_TOKEN: z.string().default('dev-verify-token'),
  META_APP_SECRET: z.string().optional(),
  ZOHO_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  ZOHO_CLIENT_ID: z.string().optional(),
  ZOHO_CLIENT_SECRET: z.string().optional(),
  ZOHO_REFRESH_TOKEN: z.string().optional(),
  ZOHO_API_DOMAIN: z.string().url('ZOHO_API_DOMAIN URL olmalı').default('https://www.zohoapis.com'),
  ZOHO_SEGMENT_FIELD_API_NAME: z.string().default('segment'),
  ZOHO_LOGO_FIELD_API_NAME: z.string().default('logo_requested_'),
  ZOHO_LOGO_FIELD_TYPE: z.enum(['select', 'checkbox']).default('select'),
  ZOHO_LOGO_SELECT_TRUE_VALUE: z.string().default('Evet'),
  ZOHO_LOGO_SELECT_FALSE_VALUE: z.string().default('Hayir')
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
