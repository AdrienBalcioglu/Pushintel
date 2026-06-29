import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  APNS_KEY_ID: z.string().optional(),
  APNS_TEAM_ID: z.string().optional(),
  APNS_BUNDLE_ID: z.string().optional(),
  APNS_KEY_PATH: z.string().default('./certs/apns.p8'),
  APNS_PRODUCTION: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .default(false),
  JWT_SECRET: z.string().min(32).optional().default('dev-secret-do-not-use-in-production-change-me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DISCORD_WEBHOOK_URL: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('⚠️  Invalid environment variables:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error('Using defaults where possible — some features may be unavailable.')
}

// Use partial result with fallbacks
const raw = parsed.success ? parsed.data : (process.env as Record<string, string | undefined>)

export const config = {
  PORT: Number(raw.PORT) || 3000,
  NODE_ENV: (['development', 'production', 'test'].includes(String(raw.NODE_ENV)) ? raw.NODE_ENV : 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: raw.DATABASE_URL,
  REDIS_URL: raw.REDIS_URL,
  FIREBASE_PROJECT_ID: raw.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: raw.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: raw.FIREBASE_PRIVATE_KEY,
  APNS_KEY_ID: raw.APNS_KEY_ID,
  APNS_TEAM_ID: raw.APNS_TEAM_ID,
  APNS_BUNDLE_ID: raw.APNS_BUNDLE_ID,
  APNS_KEY_PATH: raw.APNS_KEY_PATH || './certs/apns.p8',
  APNS_PRODUCTION: raw.APNS_PRODUCTION === 'true' || raw.APNS_PRODUCTION === true,
  JWT_SECRET: raw.JWT_SECRET || 'dev-secret-do-not-use-in-production-change-me',
  JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN || '7d',
  DISCORD_WEBHOOK_URL: raw.DISCORD_WEBHOOK_URL || undefined,
  RATE_LIMIT_WINDOW_MS: Number(raw.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX: Number(raw.RATE_LIMIT_MAX) || 100,
}
export type Config = typeof config