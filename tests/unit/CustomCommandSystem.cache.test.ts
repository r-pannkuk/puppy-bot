/**
 * Unit tests for CustomCommandSystem in-memory cache operations.
 *
 * These tests exercise the lookup and membership logic that operates entirely
 * on the in-memory Collection cache, without any database access.
 * DB-backed methods (add, edit, remove, loadFromDB) are covered separately
 * in tests/integration/CustomCommandSystem.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { Collection } from 'discord.js';
import type { CustomCommand } from '@prisma/client';
import { CustomCommandSystem } from '../../src/lib/structures/managers/CustomCommandSystem';
import { makeCustomCommand, makeGuild } from '../helpers/mocks';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSystem(commands: ReturnType<typeof makeCustomCommand>[] = []): CustomCommandSystem {
    const system = new CustomCommandSystem(makeGuild());
    const cache: Collection<string, CustomCommand> = (system as any).cache;
    for (const cmd of commands) {
        cache.set(cmd.id, cmd as unknown as CustomCommand);
    }
    return system;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CustomCommandSystem – in-memory cache', () => {

    // ── contains() ───────────────────────────────────────────────────────────

    describe('contains()', () => {
        it('returns false on an empty cache', () => {
            const sys = makeSystem();
            expect(sys.contains({ name: 'unknown' })).toBe(false);
        });

        it('returns true when looked up by name', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet' })]);
            expect(sys.contains({ name: 'greet' })).toBe(true);
        });

        it('returns true when looked up by id', () => {
            const cmd = makeCustomCommand({ id: 'abc123', name: 'greet' });
            const sys = makeSystem([cmd]);
            expect(sys.contains({ id: 'abc123' })).toBe(true);
        });

        it('returns false for an unknown name', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet' })]);
            expect(sys.contains({ name: 'nope' })).toBe(false);
        });
    });

    // ── containsNameOrAlias() ─────────────────────────────────────────────────

    describe('containsNameOrAlias()', () => {
        it('returns true when matched by name', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet', aliases: ['hi', 'hello'] })]);
            expect(sys.containsNameOrAlias({ name: 'greet' })).toBe(true);
        });

        it('returns true when matched by alias', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet', aliases: ['hi', 'hello'] })]);
            expect(sys.containsNameOrAlias({ name: 'hi' })).toBe(true);
            expect(sys.containsNameOrAlias({ name: 'hello' })).toBe(true);
        });

        it('returns false when name/alias not present', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet', aliases: ['hi'] })]);
            expect(sys.containsNameOrAlias({ name: 'bye' })).toBe(false);
        });

        it('detects conflict by aliases array overlap', () => {
            const sys = makeSystem([makeCustomCommand({ name: 'greet', aliases: ['hi'] })]);
            expect(sys.containsNameOrAlias({ name: 'anything', aliases: ['hi'] })).toBe(true);
        });
    });

    // ── getByNameOrAlias() ────────────────────────────────────────────────────

    describe('getByNameOrAlias()', () => {
        it('returns undefined on empty cache', () => {
            const sys = makeSystem();
            expect(sys.getByNameOrAlias({ name: 'x' })).toBeUndefined();
        });

        it('finds command by exact name', () => {
            const cmd = makeCustomCommand({ name: 'greet' });
            const sys = makeSystem([cmd]);
            const found = sys.getByNameOrAlias({ name: 'greet' });
            expect(found).toBeTruthy();
            expect(found!.name).toBe('greet');
        });

        it('finds command by alias', () => {
            const cmd = makeCustomCommand({ name: 'greet', aliases: ['hi'] });
            const sys = makeSystem([cmd]);
            const found = sys.getByNameOrAlias({ name: 'hi' });
            expect(found).toBeTruthy();
            expect(found!.name).toBe('greet');
        });

        it('finds command by id', () => {
            const cmd = makeCustomCommand({ id: 'x99', name: 'greet' });
            const sys = makeSystem([cmd]);
            const found = sys.getByNameOrAlias({ id: 'x99' });
            expect(found).toBeTruthy();
            expect(found!.id).toBe('x99');
        });

        it('returns undefined when name does not match', () => {
            const cmd = makeCustomCommand({ name: 'greet' });
            const sys = makeSystem([cmd]);
            expect(sys.getByNameOrAlias({ name: 'unknown' })).toBeUndefined();
        });

        it('returns the correct command when multiple commands are cached', () => {
            const a = makeCustomCommand({ id: 'id-a', name: 'alpha', aliases: [] });
            const b = makeCustomCommand({ id: 'id-b', name: 'beta', aliases: ['β'] });
            const sys = makeSystem([a, b]);

            const foundA = sys.getByNameOrAlias({ name: 'alpha' });
            const foundB = sys.getByNameOrAlias({ name: 'β' });

            expect(foundA?.id).toBe('id-a');
            expect(foundB?.id).toBe('id-b');
        });
    });

    // ── commandNamesInUse ─────────────────────────────────────────────────────

    describe('commandNamesInUse', () => {
        it('is empty when cache is empty', () => {
            const sys = makeSystem();
            expect(sys.commandNamesInUse).toEqual([]);
        });

        it('includes command ids and their aliases', () => {
            const cmd = makeCustomCommand({ id: 'my-id', name: 'greet', aliases: ['hi', 'hello'] });
            const sys = makeSystem([cmd]);
            const inUse = sys.commandNamesInUse;
            expect(inUse).toContain('my-id');
            expect(inUse).toContain('hi');
            expect(inUse).toContain('hello');
        });

        it('aggregates all commands when multiple are cached', () => {
            const a = makeCustomCommand({ id: 'id-a', name: 'alpha', aliases: ['a'] });
            const b = makeCustomCommand({ id: 'id-b', name: 'beta', aliases: ['b'] });
            const sys = makeSystem([a, b]);
            const inUse = sys.commandNamesInUse;
            expect(inUse).toContain('id-a');
            expect(inUse).toContain('a');
            expect(inUse).toContain('id-b');
            expect(inUse).toContain('b');
        });
    });

    // ── customCommands getter ─────────────────────────────────────────────────

    describe('customCommands', () => {
        it('returns an empty Collection when cache is empty', () => {
            const sys = makeSystem();
            expect(sys.customCommands.size).toBe(0);
        });

        it('returns all cached commands', () => {
            const a = makeCustomCommand({ id: 'id-a', name: 'alpha', aliases: [] });
            const b = makeCustomCommand({ id: 'id-b', name: 'beta', aliases: [] });
            const sys = makeSystem([a, b]);
            expect(sys.customCommands.size).toBe(2);
        });
    });
});
