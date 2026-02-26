/**
 * Unit tests for ReminderCommand.parseTime().
 *
 * parseTime() is a pure static method: it accepts a free-form time string and
 * returns a future Date, or throws a Sapphire UserError when the input cannot
 * be interpreted as a future moment.  No Discord client or DB is required.
 */

import { describe, it, expect } from 'vitest';
import { UserError } from '@sapphire/framework';
import { ReminderCommand } from '../../src/commands/reminders/Reminder';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = () => new Date(Date.now());

function callParseTime(input: string) {
    return () => ReminderCommand.parseTime(input);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReminderCommand – parseTime()', () => {
    // ── Duration notation (relies on @sapphire/time-utilities) ───────────────

    describe('duration notation', () => {
        it('parses "1 hour" to a date roughly 1 hour from now', () => {
            const result = ReminderCommand.parseTime('1 hour');
            const delta = result.getTime() - NOW().getTime();
            // Allow generous ±10 s window for test execution time.
            expect(delta).toBeGreaterThanOrEqual(60 * 60 * 1000 - 10_000);
            expect(delta).toBeLessThanOrEqual(60 * 60 * 1000 + 10_000);
        });

        it('parses "30 minutes" to a date roughly 30 min from now', () => {
            const result = ReminderCommand.parseTime('30 minutes');
            const delta = result.getTime() - NOW().getTime();
            expect(delta).toBeGreaterThanOrEqual(30 * 60 * 1000 - 10_000);
            expect(delta).toBeLessThanOrEqual(30 * 60 * 1000 + 10_000);
        });

        it('parses "2 days" to a date roughly 2 days from now', () => {
            const result = ReminderCommand.parseTime('2 days');
            const delta = result.getTime() - NOW().getTime();
            expect(delta).toBeGreaterThanOrEqual(2 * 24 * 60 * 60 * 1000 - 10_000);
            expect(delta).toBeLessThanOrEqual(2 * 24 * 60 * 60 * 1000 + 10_000);
        });

        it('parses "1 week" to a date roughly 7 days from now', () => {
            const result = ReminderCommand.parseTime('1 week');
            const delta = result.getTime() - NOW().getTime();
            expect(delta).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 10_000);
            expect(delta).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 10_000);
        });
    });

    // ── Natural-language notation (relies on chrono-node) ────────────────────

    describe('natural-language notation', () => {
        it('parses "next monday" to a future date', () => {
            const result = ReminderCommand.parseTime('next monday');
            expect(result.getTime()).toBeGreaterThan(NOW().getTime());
        });

        it('parses "tomorrow" to a future date', () => {
            const result = ReminderCommand.parseTime('tomorrow');
            expect(result.getTime()).toBeGreaterThan(NOW().getTime());
        });

        it('parses "next month" to a future date', () => {
            const result = ReminderCommand.parseTime('next month');
            expect(result.getTime()).toBeGreaterThan(NOW().getTime());
        });
    });

    // ── Invalid inputs ────────────────────────────────────────────────────────

    describe('invalid or past inputs (should throw UserError)', () => {
        const bad = [
            'yesterday',
            'last week',
            'not a date at all',
            '',
        ];

        for (const input of bad) {
            it(`throws for "${input}"`, () => {
                let caught: unknown;
                try {
                    ReminderCommand.parseTime(input);
                } catch (e) {
                    caught = e;
                }
                expect(caught).toBeInstanceOf(UserError);
            });
        }
    });

    // ── Return type ───────────────────────────────────────────────────────────

    it('returns a Date object', () => {
        const result = ReminderCommand.parseTime('1 hour');
        expect(result).toBeInstanceOf(Date);
        expect(isNaN(result.getTime())).toBe(false);
    });
});
