/**
 * Integration tests for GuildSettingsManager.
 *
 * Tests the loadSettings() / set() round-trip against the real MongoDB
 * database.  All writes use a dedicated test guild ID and are cleaned up
 * after each test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from '@sapphire/framework';
import { GuildSettingsManager } from '../../src/lib/structures/managers/GuildSettingsManager';
import { makeGuild } from '../helpers/mocks';

const TEST_GUILD_ID = 'test-guild-integration-gsm';
const TEST_GUILD = makeGuild(TEST_GUILD_ID);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cleanup() {
    await container.database.guildSettings.deleteMany({
        where: { guildId: TEST_GUILD_ID },
    });
}

function makeManager(): GuildSettingsManager {
    return new GuildSettingsManager(TEST_GUILD);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GuildSettingsManager – database integration', () => {

    beforeEach(async () => {
        await cleanup();
    });

    afterEach(async () => {
        await cleanup();
    });

    // ── loadSettings() ────────────────────────────────────────────────────────

    describe('loadSettings()', () => {
        it('creates a default settings record when none exists', async () => {
            // Mock the client default prefix (needed by loadSettings).
            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();

            const inDb = await container.database.guildSettings.findUnique({
                where: { guildId: TEST_GUILD_ID },
            });
            expect(inDb).toBeTruthy();
            expect(inDb!.prefix).toBe('!');
        });

        it('loads an existing settings record from the database', async () => {
            await container.database.guildSettings.create({
                data: {
                    guildId: TEST_GUILD_ID,
                    prefix: '?',
                    timezone: 'eastern',
                },
            });

            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();

            expect(mgr.prefix).toBe('?');
            expect(mgr.timezone).toBe('eastern');
        });

        it('exposes prefix and timezone via getters after loading', async () => {
            await container.database.guildSettings.create({
                data: {
                    guildId: TEST_GUILD_ID,
                    prefix: ';',
                    timezone: 'pacific',
                },
            });

            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();

            expect(mgr.prefix).toBe(';');
            expect(mgr.timezone).toBe('pacific');
        });
    });

    // ── set() ─────────────────────────────────────────────────────────────────

    describe('set()', () => {
        it('updates prefix in the database', async () => {
            await container.database.guildSettings.create({
                data: { guildId: TEST_GUILD_ID, prefix: '!' },
            });

            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();
            await mgr.set({ prefix: '$' });

            const inDb = await container.database.guildSettings.findUnique({
                where: { guildId: TEST_GUILD_ID },
            });
            expect(inDb!.prefix).toBe('$');
            expect(mgr.prefix).toBe('$');
        });

        it('updates timezone in the database', async () => {
            await container.database.guildSettings.create({
                data: { guildId: TEST_GUILD_ID, prefix: '!' },
            });

            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();
            await mgr.set({ timezone: 'utc' });

            const inDb = await container.database.guildSettings.findUnique({
                where: { guildId: TEST_GUILD_ID },
            });
            expect(inDb!.timezone).toBe('utc');
            expect(mgr.timezone).toBe('utc');
        });

        it('can update multiple fields at once', async () => {
            await container.database.guildSettings.create({
                data: { guildId: TEST_GUILD_ID, prefix: '!', timezone: 'eastern' },
            });

            (container as any).client = {
                options: { defaultPrefix: '!' },
                guilds: { cache: { get: () => undefined } },
            };

            const mgr = makeManager();
            await mgr.loadSettings();
            await mgr.set({ prefix: '~', timezone: 'pacific' });

            expect(mgr.prefix).toBe('~');
            expect(mgr.timezone).toBe('pacific');
        });
    });

    // ── Read from live data ───────────────────────────────────────────────────

    describe('read from existing database records', () => {
        it('correctly reads GuildSettings that already exist in the DB for each stored guild', async () => {
            // Read all guild settings from the live database (read-only, no mutation).
            const allSettings = await container.database.guildSettings.findMany({
                take: 10,
            });

            for (const settings of allSettings) {
                expect(settings.guildId).toBeTypeOf('string');
                expect(settings.guildId).not.toBe('');
                if (settings.prefix !== null) {
                    expect(settings.prefix).toBeTypeOf('string');
                }
            }
        });
    });
});
