/**
 * Integration tests for CustomCommandSystem.
 *
 * These tests hit the real MongoDB database pointed at by the MONGO_URL env
 * var.  All test data is written to a dedicated test guild ID and cleaned up
 * after each test, so existing production data is never modified.
 *
 * Prerequisites:
 *   - MONGO_URL env var set (from .env or CI secrets).
 *   - The setup.ts root-hook must have run first (injects container.database).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from '@sapphire/framework';
import { CustomCommandSystem } from '../../src/lib/structures/managers/CustomCommandSystem';
import { makeGuild } from '../helpers/mocks';

const TEST_GUILD_ID = 'test-guild-integration-ccs';
const TEST_GUILD = makeGuild(TEST_GUILD_ID);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cleanupTestCommands() {
    await container.database.customCommand.deleteMany({
        where: { guildId: TEST_GUILD_ID },
    });
}

function makeSystem(): CustomCommandSystem {
    return new CustomCommandSystem(TEST_GUILD);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CustomCommandSystem – database integration', () => {

    let sys: CustomCommandSystem;

    beforeEach(async () => {
        await cleanupTestCommands();
        sys = makeSystem();
    });

    afterEach(async () => {
        await cleanupTestCommands();
    });

    // ── add() ─────────────────────────────────────────────────────────────────

    describe('add()', () => {
        it('persists a new command to the database', async () => {
            await sys.add({
                name: 'hello',
                aliases: ['hi'],
                ownerId: 'owner-001',
                content: 'Hello, world!',
            });

            const inDb = await container.database.customCommand.findFirst({
                where: { guildId: TEST_GUILD_ID, name: 'hello' },
            });
            expect(inDb).toBeTruthy();
            expect(inDb!.content).toBe('Hello, world!');
        });

        it('populates the in-memory cache after add', async () => {
            await sys.add({ name: 'hello', aliases: [], ownerId: 'owner-001', content: 'Hi!' });
            expect(sys.contains({ name: 'hello' })).toBe(true);
        });

        it('sets useCount to 0 by default', async () => {
            await sys.add({ name: 'hello', aliases: [], ownerId: 'owner-001', content: 'Hi!' });
            const cmd = sys.getByNameOrAlias({ name: 'hello' });
            expect(cmd!.useCount).toBe(0);
        });

        it('throws when a command with the same name already exists', async () => {
            await sys.add({ name: 'dupe', aliases: [], ownerId: 'owner-001', content: 'A' });
            let caught: unknown;
            try {
                await sys.add({ name: 'dupe', aliases: [], ownerId: 'owner-002', content: 'B' });
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeTruthy();
        });

        it('throws when an alias clashes with an existing command name', async () => {
            await sys.add({ name: 'hello', aliases: [], ownerId: 'owner-001', content: 'A' });
            let caught: unknown;
            try {
                await sys.add({ name: 'other', aliases: ['hello'], ownerId: 'owner-001', content: 'B' });
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeTruthy();
        });
    });

    // ── loadFromDB() ──────────────────────────────────────────────────────────

    describe('loadFromDB()', () => {
        it('loads commands inserted by another system instance', async () => {
            // Seed directly via Prisma, bypassing the current system instance.
            await container.database.customCommand.create({
                data: {
                    guildId: TEST_GUILD_ID,
                    name: 'seeded',
                    aliases: ['s'],
                    ownerId: 'owner-001',
                    content: 'seeded content',
                    useCount: 0,
                },
            });

            const freshSys = makeSystem();
            await freshSys.loadFromDB();

            expect(freshSys.contains({ name: 'seeded' })).toBe(true);
        });

        it('populates the cache with all guild commands', async () => {
            await container.database.customCommand.createMany({
                data: [
                    { guildId: TEST_GUILD_ID, name: 'cmd1', aliases: [], ownerId: 'o', content: 'c1', useCount: 0 },
                    { guildId: TEST_GUILD_ID, name: 'cmd2', aliases: [], ownerId: 'o', content: 'c2', useCount: 0 },
                ],
            });

            const freshSys = makeSystem();
            await freshSys.loadFromDB();

            expect(freshSys.customCommands.size).toBe(2);
        });
    });

    // ── edit() ────────────────────────────────────────────────────────────────

    describe('edit()', () => {
        it('updates content in both the cache and the database', async () => {
            const cmd = await sys.add({ name: 'greeting', aliases: [], ownerId: 'o', content: 'old' });
            await sys.edit({ id: cmd.id, content: 'new' });

            const cached = sys.getByNameOrAlias({ name: 'greeting' });
            expect(cached!.content).toBe('new');

            const inDb = await container.database.customCommand.findFirst({
                where: { id: cmd.id },
            });
            expect(inDb!.content).toBe('new');
        });

        it('merges aliases (union) without dropping existing ones', async () => {
            const cmd = await sys.add({ name: 'greeting', aliases: ['hi'], ownerId: 'o', content: 'c' });
            await sys.edit({ id: cmd.id, aliases: ['hello'] });

            const cached = sys.getByNameOrAlias({ name: 'greeting' });
            expect(cached!.aliases).toContain('hi');
            expect(cached!.aliases).toContain('hello');
        });

        it('throws when neither id nor name is provided', async () => {
            let caught: unknown;
            try {
                await sys.edit({ content: 'new' });
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeTruthy();
        });

        it('throws when the referenced command does not exist', async () => {
            let caught: unknown;
            try {
                await sys.edit({ name: 'nonexistent', content: 'x' });
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeTruthy();
        });
    });

    // ── remove() ─────────────────────────────────────────────────────────────

    describe('remove()', () => {
        it('deletes the command from the database', async () => {
            const cmd = await sys.add({ name: 'byebye', aliases: [], ownerId: 'o', content: 'c' });
            await sys.remove({ id: cmd.id });

            const inDb = await container.database.customCommand.findFirst({
                where: { id: cmd.id },
            });
            expect(inDb).toBeNull();
        });

        it('evicts the command from the in-memory cache', async () => {
            const cmd = await sys.add({ name: 'byebye', aliases: [], ownerId: 'o', content: 'c' });
            await sys.remove({ id: cmd.id });

            expect(sys.contains({ name: 'byebye' })).toBe(false);
        });

        it('throws when command is not found', async () => {
            let caught: unknown;
            try {
                await sys.remove({ name: 'ghost' });
            } catch (e) {
                caught = e;
            }
            expect(caught).toBeTruthy();
        });
    });

    // ── removeAll() ───────────────────────────────────────────────────────────

    describe('removeAll()', () => {
        it('deletes every command for the guild', async () => {
            await sys.add({ name: 'c1', aliases: [], ownerId: 'o', content: 'x' });
            await sys.add({ name: 'c2', aliases: [], ownerId: 'o', content: 'y' });

            await sys.removeAll();

            const remaining = await container.database.customCommand.findMany({
                where: { guildId: TEST_GUILD_ID },
            });
            expect(remaining).toHaveLength(0);
        });

        it('clears the in-memory cache', async () => {
            await sys.add({ name: 'c1', aliases: [], ownerId: 'o', content: 'x' });
            await sys.removeAll();
            expect(sys.customCommands.size).toBe(0);
        });
    });

    // ── getByNameOrAliasWithFallback() ────────────────────────────────────────

    describe('getByNameOrAliasWithFallback()', () => {
        it('returns the command from cache when it exists', async () => {
            await sys.add({ name: 'cached', aliases: [], ownerId: 'o', content: 'c' });
            const result = await sys.getByNameOrAliasWithFallback('cached');
            expect(result).toBeTruthy();
            expect(result!.name).toBe('cached');
        });

        it('hits the database when the cache is empty', async () => {
            // Seed DB directly.
            await container.database.customCommand.create({
                data: {
                    guildId: TEST_GUILD_ID,
                    name: 'dbonly',
                    aliases: ['db'],
                    ownerId: 'o',
                    content: 'from db',
                    useCount: 0,
                },
            });

            // Fresh system – no loadFromDB, cache is empty.
            const freshSys = makeSystem();
            const result = await freshSys.getByNameOrAliasWithFallback('dbonly');
            expect(result).toBeTruthy();
            expect(result!.content).toBe('from db');
        });

        it('returns null for a non-existent command', async () => {
            const result = await sys.getByNameOrAliasWithFallback('completely-missing');
            expect(result).toBeNull();
        });

        it('repopulates cache on DB fallback hit', async () => {
            await container.database.customCommand.create({
                data: {
                    guildId: TEST_GUILD_ID,
                    name: 'lazycached',
                    aliases: [],
                    ownerId: 'o',
                    content: 'lazy',
                    useCount: 0,
                },
            });

            const freshSys = makeSystem();
            await freshSys.getByNameOrAliasWithFallback('lazycached');

            // Now it should be in cache.
            expect(freshSys.contains({ name: 'lazycached' })).toBe(true);
        });
    });
});
