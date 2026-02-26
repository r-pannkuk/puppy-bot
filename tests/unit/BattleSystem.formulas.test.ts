/**
 * Unit tests for BattleSystem damage/experience/duration formulae.
 *
 * All formula functions under `BattleSystem.Trap.DamageFormula`,
 * `BattleSystem.Trap.ExperienceFormula`, and `BattleSystem.Trap.DurationFormula`
 * are pure functions of their inputs.  These tests exercise them with
 * hand-crafted config and trap stubs – no Discord client or DB required.
 */

import { describe, it, expect } from 'vitest';
import { Collection } from 'discord.js';
import { BattleTrapState, BattleTrapRecordType } from '@prisma/client';
import { BattleSystem } from '../../src/lib/structures/managers/BattleSystem';
import { makeBattleConfig, makeTrap } from '../helpers/mocks';

// ── Shared fixtures ───────────────────────────────────────────────────────────

const CFG = makeBattleConfig({
    trapConfig: {
        trapExplodeIconSourceURL: '',
        trapArmedIconSourceURL: '',
        trapSelfIconSourceURL: '',
        trapChannelId: null,
        removeTrapExperienceScalar: 10,
        timeSecsToDeleteTrapMessage: 10,
        damage: {
            formulaType: 'Base' as any,
            wordScalar: 2,
            numCharacterScalar: 1,
            timeIntervals: [
                { intervalSecs: 60, damageScalar: 0.1 },
                { intervalSecs: 300, damageScalar: 0.2 },
            ],
            exponentialScalar: 0.5,
            linearScalar: 0.01,
        },
    } as any,
});

// A trap armed 60 seconds ago
const TRAP_60S = makeTrap('hello world', new Date(Date.now() - 60_000));

// A trap with a longer phrase
const TRAP_LONG = makeTrap('this is a much longer trap phrase with many words', new Date(Date.now() - 60_000));
const TRAP_SHORT = makeTrap('hi', new Date(Date.now() - 60_000));

// ── BASE_DAMAGE ───────────────────────────────────────────────────────────────

describe('BattleSystem.Trap.DamageFormula', () => {
    describe('BASE_DAMAGE()', () => {
        it('returns a positive number for a normal phrase', () => {
            const dmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            expect(dmg).toBeTypeOf('number');
            expect(dmg).toBeGreaterThan(0);
        });

        it('formula is (words × wordScalar) × (chars × charScalar)', () => {
            // 'hello world' → 2 words, 11 chars ; wordScalar=2, charScalar=1
            const expected = (2 * 2) * (11 * 1); // = 44
            const dmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            expect(dmg).toBe(expected);
        });

        it('longer phrase deals more base damage than shorter phrase', () => {
            const longDmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_LONG);
            const shortDmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_SHORT);
            expect(longDmg).toBeGreaterThan(shortDmg);
        });

        it('single-word phrase uses 1 for word count', () => {
            const singleWord = makeTrap('boom');
            // 1 word × 2 + 4 chars × 1 = 2 × 4 = 8
            const dmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, singleWord);
            expect(dmg).toBe((1 * 2) * (4 * 1));
        });
    });

    // ── LINEAR ──────────────────────────────────────────────────────────────

    describe('LINEAR()', () => {
        it('equals BASE_DAMAGE + duration × linearScalar', () => {
            const base = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            const duration = TRAP_60S.duration();
            const expected = base + duration * CFG.trapConfig.damage.linearScalar!;
            const actual = BattleSystem.Trap.DamageFormula.LINEAR(CFG, TRAP_60S);
            expect(actual).toBeGreaterThanOrEqual(expected - 100); // 100ms slop for execution time
            expect(actual).toBeLessThanOrEqual(expected + 100);
        });

        it('is greater than or equal to BASE_DAMAGE when duration > 0', () => {
            const base = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            const linear = BattleSystem.Trap.DamageFormula.LINEAR(CFG, TRAP_60S);
            expect(linear).toBeGreaterThanOrEqual(base);
        });

        it('increases with duration', () => {
            const oldTrap = makeTrap('hello world', new Date(Date.now() - 600_000));
            const newTrap = makeTrap('hello world', new Date(Date.now() - 60_000));
            const oldDmg = BattleSystem.Trap.DamageFormula.LINEAR(CFG, oldTrap);
            const newDmg = BattleSystem.Trap.DamageFormula.LINEAR(CFG, newTrap);
            expect(oldDmg).toBeGreaterThan(newDmg);
        });
    });

    // ── EXPONENTIAL ──────────────────────────────────────────────────────────

    describe('EXPONENTIAL()', () => {
        it('equals BASE_DAMAGE + duration × exponentialScalar', () => {
            const base = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            const duration = TRAP_60S.duration();
            const expected = base + duration * CFG.trapConfig.damage.exponentialScalar!;
            const actual = BattleSystem.Trap.DamageFormula.EXPONENTIAL(CFG, TRAP_60S);
            expect(actual).toBeGreaterThanOrEqual(expected - 100);
            expect(actual).toBeLessThanOrEqual(expected + 100);
        });

        it('is greater than or equal to BASE_DAMAGE when duration > 0', () => {
            const base = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            const exp = BattleSystem.Trap.DamageFormula.EXPONENTIAL(CFG, TRAP_60S);
            expect(exp).toBeGreaterThanOrEqual(base);
        });
    });

    // ── INTERVAL ─────────────────────────────────────────────────────────────

    describe('INTERVAL()', () => {
        it('returns a positive number', () => {
            const dmg = BattleSystem.Trap.DamageFormula.INTERVAL(CFG, TRAP_60S);
            expect(dmg).toBeGreaterThan(0);
        });

        it('is greater than or equal to BASE_DAMAGE', () => {
            const base = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            const interval = BattleSystem.Trap.DamageFormula.INTERVAL(CFG, TRAP_60S);
            expect(interval).toBeGreaterThanOrEqual(base);
        });

        it('increases with duration', () => {
            const oldTrap = makeTrap('hello world', new Date(Date.now() - 600_000));
            const newTrap = makeTrap('hello world', new Date(Date.now() - 60_000));
            const oldDmg = BattleSystem.Trap.DamageFormula.INTERVAL(CFG, oldTrap);
            const newDmg = BattleSystem.Trap.DamageFormula.INTERVAL(CFG, newTrap);
            expect(oldDmg).toBeGreaterThan(newDmg);
        });
    });

    // ── WORDS_DAMAGE / CHARACTERS_DAMAGE ─────────────────────────────────────

    describe('WORDS_DAMAGE()', () => {
        it('equals wordCount × wordScalar', () => {
            const dmg = BattleSystem.Trap.DamageFormula.WORDS_DAMAGE(CFG, TRAP_60S);
            expect(dmg).toBe(2 * 2); // 'hello world' = 2 words × wordScalar 2
        });
    });

    describe('CHARACTERS_DAMAGE()', () => {
        it('equals charCount × numCharacterScalar', () => {
            const dmg = BattleSystem.Trap.DamageFormula.CHARACTERS_DAMAGE(CFG, TRAP_60S);
            expect(dmg).toBe(11 * 1); // 'hello world' = 11 chars × charScalar 1
        });
    });
});

// ── ExperienceFormula ─────────────────────────────────────────────────────────

describe('BattleSystem.Trap.ExperienceFormula', () => {
    describe('BASE_EXPERIENCE()', () => {
        it('returns the same value as BASE_DAMAGE for the same inputs', () => {
            const xp = BattleSystem.Trap.ExperienceFormula.BASE_EXPERIENCE(CFG, TRAP_60S);
            const dmg = BattleSystem.Trap.DamageFormula.BASE_DAMAGE(CFG, TRAP_60S);
            expect(xp).toBe(dmg);
        });

        it('returns a positive number', () => {
            const xp = BattleSystem.Trap.ExperienceFormula.BASE_EXPERIENCE(CFG, TRAP_60S);
            expect(xp).toBeGreaterThan(0);
        });
    });
});

// ── DurationFormula ───────────────────────────────────────────────────────────

describe('BattleSystem.Trap.DurationFormula', () => {
    it('returns time-since-creation for an Armed trap', () => {
        const msAgo = 60_000;
        const trap = makeTrap('hello', new Date(Date.now() - msAgo));
        const duration = BattleSystem.Trap.DurationFormula(trap);
        expect(duration).toBeGreaterThanOrEqual(msAgo - 200); // 200ms slop
        expect(duration).toBeLessThanOrEqual(msAgo + 200);
    });

    it('returns duration from createdAt to firedAt for a Triggered trap', () => {
        const createdAt = new Date(Date.now() - 120_000);
        const firedAt = Date.now() - 60_000;

        const trap = {
            ...makeTrap('phrase', createdAt),
            state: BattleTrapState.Fired,
            records: new Collection([
                ['rec-1', {
                    id: 'rec-1',
                    type: BattleTrapRecordType.Trigger,
                    trapId: 'trap-id',
                    guildId: 'guild',
                    payload: {
                        createdAt: createdAt.getTime(),
                        firedAt,
                    } as any,
                    getTrap: () => undefined as any,
                }]
            ]),
        } as any as BattleSystem.Trap.Instance;

        const duration = BattleSystem.Trap.DurationFormula(trap);
        expect(duration).toBe(firedAt - createdAt.getTime());
    });

    it('returns time-since-creation when no terminal record is found', () => {
        const msAgo = 30_000;
        const trap = {
            ...makeTrap('hello', new Date(Date.now() - msAgo)),
            state: BattleTrapState.Fired,
            records: new Collection(), // no relevant record
        } as any as BattleSystem.Trap.Instance;

        const duration = BattleSystem.Trap.DurationFormula(trap);
        expect(duration).toBeGreaterThanOrEqual(msAgo - 200);
        expect(duration).toBeLessThanOrEqual(msAgo + 200);
    });
});
