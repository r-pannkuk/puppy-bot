/**
 * Unit tests for DiceRollCommand.
 *
 * Targets the pure static validation logic in `DiceRollCommand`:
 *   - DiceRollCommand.validDice() parses legal notations without error.
 *   - DiceRollCommand.validDice() throws a Sapphire `UserError` for illegal notations.
 *
 * No Discord client, database, or HTTP calls are required.
 */

import { describe, it, expect } from 'vitest';
import { DiceRoll } from '@dice-roller/rpg-dice-roller';

// Access the protected static helper via the class itself (cast away visibility).
import { DiceRollCommand } from '../../src/commands/rng/DiceRollCommand';
const validDice: (param: string) => void = (DiceRollCommand as any).validDice;

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
