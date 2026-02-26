/**
 * @file schema.ts
 * @description Zod schema for all environment variables.
 *
 * Parsed once at module load time. Any missing required variable throws
 * immediately with a descriptive message rather than failing silently at
 * first use. Import `env` anywhere you need a typed env value; use the
 * legacy `envParse*` helpers if an existing call-site needs to stay unchanged.
 */
import { z } from 'zod';

const boolStr = z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .or(z.boolean());

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Discord
    TOKEN: z.string(),
    CLIENT_PREFIX: z.string().default('!'),
    CLIENT_OWNERS: z.string().default(''),
    CLIENT_ID: z.string(),
    DEV_GUILD_ID: z.string(),
    CLIENT_NAME: z.string().optional(),
    CLIENT_VERSION: z.string().optional(),
    CLIENT_PRESENCE_NAME: z.string().optional(),
    CLIENT_PRESENCE_TYPE: z.string().optional(),

    // Database
    MONGO_URL: z.string(),

    // Redis (Bull scheduled tasks)
    REDIS_PASSWORD: z.string(),
    REDIS_PORT: z.coerce.number().int().default(6379),
    REDIS_URL: z.string(),
    REDIS_DB: z.coerce.number().int().default(0),

    // Error tracking
    SENTRY_URL: z.string().optional(),

    // Subsystems
    BATTLESYSTEM_INTERVAL_SECS: z.coerce.number().int().default(300),

    // Timezone for reminder parsing
    DEFAULT_TIMEZONE: z.enum(['eastern', 'pacific', 'utc']).default('eastern'),

    // SoundCloud (optional)
    SOUNDCLOUD_TOKEN: z.string().optional(),

    // Lavalink / Shoukaku music backend
    LAVALINK_HOST: z.string().default('localhost'),
    LAVALINK_PORT: z.coerce.number().int().default(2333),
    LAVALINK_PASSWORD: z.string().default('youshallnotpass'),
    LAVALINK_SECURE: boolStr.default(false),
    LAVALINK_ENABLED: boolStr.default(true),

    // Logging toggles
    LOG_DEBUG: boolStr.optional(),
    LOG_INFO: boolStr.optional(),
    LOG_WARN: boolStr.optional(),
    DOTENV_DEBUG_ENABLED: boolStr.optional(),

    // Optional integrations
    GOOGLE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    CHALLONGE_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * The fully-parsed, type-safe environment. Throws a `ZodError` at startup
 * if any required variable is missing or has an invalid value.
 */
export const env: Env = envSchema.parse(process.env);
