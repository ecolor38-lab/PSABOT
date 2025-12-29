import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  
  // Database
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),

  // AI
  OPENAI_API_KEY: z.string(),
  SERPAPI_KEY: z.string(),

  // Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  GOOGLE_DOCS_SCHEMA_ID: z.string().optional(),
  GOOGLE_DOCS_PROMPT_ID: z.string().optional(),

  // Twitter
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  TWITTER_ACCESS_TOKEN: z.string().optional(),
  TWITTER_ACCESS_SECRET: z.string().optional(),

  // Facebook + Instagram
  FACEBOOK_PAGE_ID: z.string().optional(),
  FACEBOOK_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),

  // LinkedIn
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  LINKEDIN_ORGANIZATION_ID: z.string().optional(),

  // ImgBB
  IMGBB_API_KEY: z.string().optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Approval
  APPROVAL_SECRET: z.string(),
  APPROVAL_TIMEOUT_MINUTES: z.coerce.number().default(45),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
