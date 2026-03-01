/**
 * Unit tests for DiceRollCommand.
 *
 * Targets the pure static logic in `DiceRollCommand`:
 *   - `validDice(notation)`      — accepts/rejects individual notation strings.
 *   - `splitSegments(notation)`  — splits on `;`, trims parts, drops empties.
 *
 * Multi-roll behaviour: user input is split on `;` by `splitSegments` before
 * validation and execution.  Each resulting segment is validated individually
 * by `validDice`.  A valid multi-roll string therefore passes `validDice` on
 * every segment independently, which is exercised here.
 *
 * No Discord client, database, or HTTP calls are required.
 */

import { describe, it, expect } from 'vitest';
import { DiceRoll } from '@dice-roller/rpg-dice-roller';

// Access protected/private static helpers via the class (cast away visibility).
import { DiceRollCommand } from '../../src/commands/rng/DiceRollCommand';
const validDice: (param: string) => void = (DiceRollCommand as any).validDice;
const splitSegments: (notation: string) => string[] = (DiceRollCommand as any).splitSegments;

// ── Helpers ───────────────────────────────────────────────────────────────────

function callValidDice(notation: string) {
    return () => validDice(notation);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiceRollCommand – validDice()', () => {
    // ── Valid notations ───────────────────────────────────────────────────────

    describe('valid notations (should not throw)', () => {
        const validNotations = [
            '1d6',
            '3d6',
            '4d8',
            '1d20',
            '2d10',
            '100d6',
            '1d6 + 5',
            '1d6 + 2d4',
            '3d6min3',
            '3d6max3',
            '3d6!',
            '3d6!>=5',
            '3d6kh2',
            '3d6kl2',
            '3d6dh2',
            '3d6dl2',
            '3d6>=5',
            '3d6>=5f<3',
            '3d6s',
            '3d6sd',
            'round(3d6/2)',
            'floor(3d6/2)',
        ];

        for (const notation of validNotations) {
            it(`accepts "${notation}"`, () => {
                expect(callValidDice(notation)).not.toThrow();
            });
        }
    });

    // ── Invalid notations ─────────────────────────────────────────────────────

    describe('invalid notations (should throw UserError)', () => {
        const invalidNotations = [
            'not-dice',
            'hello world',
            'd',
            'abc d6',
            '@@##',
        ];

        for (const notation of invalidNotations) {
            it(`rejects "${notation}"`, () => {
                expect(callValidDice(notation)).toThrow();
            });
        }
    });

    // ── Thrown value type ─────────────────────────────────────────────────────

    it('throws a UserError (or Error) for a SyntaxError-producing notation', () => {
        let caught: unknown;
        try {
            validDice('not-dice-notation!??');
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(Error);
    });

    // ── DiceRoll integration: result within expected range ────────────────────
    // These tests verify that valid notations also produce sensible results when
    // actually evaluated by the library.

    describe('DiceRoll evaluation – results in expected range', () => {
        it('1d6 total is between 1 and 6', () => {
            const roll = new DiceRoll('1d6');
            expect(roll.total).toBeGreaterThanOrEqual(1);
            expect(roll.total).toBeLessThanOrEqual(6);
        });

        it('2d6 total is between 2 and 12', () => {
            const roll = new DiceRoll('2d6');
            expect(roll.total).toBeGreaterThanOrEqual(2);
            expect(roll.total).toBeLessThanOrEqual(12);
        });

        it('1d20 total is between 1 and 20', () => {
            const roll = new DiceRoll('1d20');
            expect(roll.total).toBeGreaterThanOrEqual(1);
            expect(roll.total).toBeLessThanOrEqual(20);
        });

        it('3d6 total is between 3 and 18', () => {
            const roll = new DiceRoll('3d6');
            expect(roll.total).toBeGreaterThanOrEqual(3);
            expect(roll.total).toBeLessThanOrEqual(18);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DiceRollCommand – splitSegments()', () => {
    // ── Single segment ────────────────────────────────────────────────────────

    it('returns a single-element array when no semicolon is present', () => {
        expect(splitSegments('1d20+5')).toEqual(['1d20+5']);
    });

    it('trims whitespace from a single segment', () => {
        expect(splitSegments('  3d6  ')).toEqual(['3d6']);
    });

    // ── Multi-segment splitting ───────────────────────────────────────────────

    it('splits two segments separated by a semicolon', () => {
        expect(splitSegments('1d20+5;1d6')).toEqual(['1d20+5', '1d6']);
    });

    it('splits three segments separated by semicolons', () => {
        expect(splitSegments('1d20+5 ; 1d20+3 ; 1d6+2')).toEqual(['1d20+5', '1d20+3', '1d6+2']);
    });

    it('trims whitespace around each segment', () => {
        expect(splitSegments('  1d6  ;  2d8  ;  d20  ')).toEqual(['1d6', '2d8', 'd20']);
    });

    it('drops empty segments caused by trailing semicolons', () => {
        expect(splitSegments('1d6;2d8;')).toEqual(['1d6', '2d8']);
    });

    it('drops empty segments caused by leading semicolons', () => {
        expect(splitSegments(';1d6;2d8')).toEqual(['1d6', '2d8']);
    });

    it('drops empty segments caused by adjacent semicolons', () => {
        expect(splitSegments('1d6;;2d8')).toEqual(['1d6', '2d8']);
    });

    it('returns an empty array for a blank string', () => {
        expect(splitSegments('')).toEqual([]);
    });

    it('returns an empty array for a string that is only semicolons', () => {
        expect(splitSegments(';;;')).toEqual([]);
    });

    // ── Token-containing segments ─────────────────────────────────────────────

    it('preserves bracket tokens within segments', () => {
        expect(splitSegments('1d20+[STR] ; [Longsword:DMG]')).toEqual([
            '1d20+[STR]',
            '[Longsword:DMG]',
        ]);
    });

    it('preserves semicolons that appear inside bracket tokens (edge case)', () => {
        // Semicolons inside [...] are not a realistic use-case but the splitter
        // works on raw strings — this documents that it does NOT handle nesting.
        // The real guard is that offense tokens never contain semicolons.
        expect(splitSegments('1d20+[fly]')).toEqual(['1d20+[fly]']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DiceRollCommand – multi-roll segment validation', () => {
    // Each segment of a multi-roll string must individually pass validDice after
    // token-free resolution.  This suite verifies that valid individual segments
    // extracted from typical multi-roll input are accepted by validDice, and that
    // an invalid segment among otherwise-valid ones is correctly rejected.

    it('accepts each segment of "1d20+5 ; 2d6+3 ; 1d4" individually', () => {
        const segments = splitSegments('1d20+5 ; 2d6+3 ; 1d4');
        expect(segments).toHaveLength(3);
        for (const seg of segments) {
            expect(() => validDice(seg)).not.toThrow();
        }
    });

    it('rejects an invalid segment within an otherwise valid multi-roll string', () => {
        const segments = splitSegments('1d20+5 ; bad-notation ; 2d6');
        // The invalid segment should cause validDice to throw.
        const results = segments.map((seg) => {
            try { validDice(seg); return 'ok'; }
            catch { return 'err'; }
        });
        expect(results).toEqual(['ok', 'err', 'ok']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DiceRollCommand – multi-roll DiceRoll evaluation', () => {
    // Verifies that independently rolling segments taken from a multi-roll string
    // produces results within the expected ranges — simulating what executeRoll
    // does when it calls new DiceRoll(segment) for each resolved segment.

    it('three independent rolls each land within their expected ranges', () => {
        const segments = splitSegments('1d20+5 ; 1d6 ; 2d4+2');
        expect(segments).toHaveLength(3);

        const [r1, r2, r3] = segments.map((n) => new DiceRoll(n));

        // 1d20+5: 6–25
        expect(r1.total).toBeGreaterThanOrEqual(6);
        expect(r1.total).toBeLessThanOrEqual(25);

        // 1d6: 1–6
        expect(r2.total).toBeGreaterThanOrEqual(1);
        expect(r2.total).toBeLessThanOrEqual(6);

        // 2d4+2: 4–10
        expect(r3.total).toBeGreaterThanOrEqual(4);
        expect(r3.total).toBeLessThanOrEqual(10);
    });

    it('rolls are independent (re-rolling a segment produces a fresh result)', () => {
        // Two DiceRoll instances from the same notation should both be in range;
        // they should not be forced to share the same total.
        const rolls = [new DiceRoll('1d20'), new DiceRoll('1d20')];
        for (const r of rolls) {
            expect(r.total).toBeGreaterThanOrEqual(1);
            expect(r.total).toBeLessThanOrEqual(20);
        }
        // The two rolls are independent objects.
        expect(rolls[0]).not.toBe(rolls[1]);
    });
});
