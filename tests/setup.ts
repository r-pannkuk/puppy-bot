/**
 * Mocha root-hooks and global test environment setup.
 *
 * Loaded before any test file by .mocharc.json's `require` field.
 * Sets minimum required environment variables so that modules that read
 * env-vars at import-time (e.g. BattleSystem's static field) don't throw
 * even when a full .env file is not present.
 */

// ── 1. Load .env before anything reads process.env ───────────────────────────
import 'dotenv/config';

// ── 1a. Apply Date prototype extensions (isDstObserved, stdTimezoneOffset) ───
// constants.ts evaluates getDefaultTimezone() at module load time, which calls
// Date.prototype.isDstObserved().  This extension is defined in time.ts so we
// must import it before any src module that transitively imports constants.ts.
import '../src/lib/utils/time';

// ── 2. Supply test defaults for required env vars ─────────────────────────────
const TEST_ENV_DEFAULTS: Record<string, string> = {
    NODE_ENV: 'test',
    BATTLESYSTEM_INTERVAL_SECS: '60',
    AWBW_SCAN_INTERVAL_SECS: '300',
    DEV_GUILD_ID: '000000000000000000',
    DEFAULT_TIMEZONE: 'utc',
    CLIENT_PREFIX: '!',
    CLIENT_NAME: 'puppy-bot-test',
    CLIENT_VERSION: '0.0.0',
    CLIENT_OWNERS: '000000000000000000',
    CLIENT_ID: '000000000000000000',
    CLIENT_PRESENCE_NAME: 'test',
    CLIENT_PRESENCE_TYPE: '0',
    DOTENV_DEBUG_ENABLED: 'false',
    LOG_DEBUG: 'false',
    LOG_INFO: 'false',
    LOG_WARN: 'false',
};

for (const [key, val] of Object.entries(TEST_ENV_DEFAULTS)) {
    if (!process.env[key]) process.env[key] = val;
}

// ── 3. Inject a real PrismaClient into the Sapphire container ─────────────────
// This lets integration tests hit the real MongoDB pointed at by MONGO_URL.
// Unit tests that do not touch `container.database` are unaffected.
import { PrismaClient } from '@prisma/client';
import { container } from '@sapphire/framework';
import { beforeAll, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
    (container as any).database = prisma;
});

afterAll(async () => {
    await prisma.$disconnect();
});
