/**
 * Unit tests for GroupsCommand.generateEmbed().
 *
 * `generateEmbed` is a pure-logic method: it accepts a group size and a list
 * of entry strings, randomly partitions them into evenly-sized groups, and
 * returns a Discord.js EmbedBuilder.  No Discord client or container needed.
 */

import { describe, it, expect } from 'vitest';
import { EmbedBuilder } from 'discord.js';
import { GroupsCommand } from '../../src/commands/rng/GroupsCommand';

// Call the instance method without constructing a full GroupsCommand (which
// would require the Sapphire container).  generateEmbed doesn't use `this`.
const generateEmbed: GroupsCommand['generateEmbed'] =
    GroupsCommand.prototype.generateEmbed.bind(GroupsCommand.prototype);

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalEntriesInEmbed(embed: EmbedBuilder): number {
    return embed.data.fields?.reduce((sum, field) => {
        // Each field value is newline-separated entries.
        const lines = field.value.split('\n').filter((l) => l.trim() !== '');
        return sum + lines.length;
    }, 0) ?? 0;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GroupsCommand – generateEmbed()', () => {
    describe('group count', () => {
        it('divides 4 entries into 2 groups of size 2', () => {
            const embed = generateEmbed(2, ['Alice', 'Bob', 'Carol', 'Dave']);
            expect(embed.data.fields).toHaveLength(2);
        });

        it('divides 6 entries into 2 groups of size 3', () => {
            const embed = generateEmbed(3, ['A', 'B', 'C', 'D', 'E', 'F']);
            expect(embed.data.fields).toHaveLength(2);
        });

        it('divides 3 entries into 3 single-person groups', () => {
            const embed = generateEmbed(1, ['X', 'Y', 'Z']);
            expect(embed.data.fields).toHaveLength(3);
        });

        it('handles a single entry grouped alone', () => {
            const embed = generateEmbed(1, ['Solo']);
            expect(embed.data.fields).toHaveLength(1);
        });

        it('handles all entries in one group', () => {
            const embed = generateEmbed(10, ['A', 'B', 'C']);
            expect(embed.data.fields).toHaveLength(1);
        });
    });

    describe('entry coverage', () => {
        it('includes every entry exactly once (4 entries, size 2)', () => {
            const entries = ['Alice', 'Bob', 'Carol', 'Dave'];
            const embed = generateEmbed(2, entries);
            expect(totalEntriesInEmbed(embed)).toBe(entries.length);
        });

        it('includes every entry exactly once (6 entries, size 3)', () => {
            const entries = ['A', 'B', 'C', 'D', 'E', 'F'];
            const embed = generateEmbed(3, entries);
            expect(totalEntriesInEmbed(embed)).toBe(entries.length);
        });

        it('includes every entry exactly once (7 entries, size 3 – uneven)', () => {
            const entries = ['1', '2', '3', '4', '5', '6', '7'];
            const embed = generateEmbed(3, entries);
            expect(totalEntriesInEmbed(embed)).toBe(entries.length);
        });
    });

    describe('field structure', () => {
        it('names groups sequentially starting at "Group 1:"', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D']);
            const names = embed.data.fields?.map((f) => f.name) ?? [];
            expect(names[0]).toBe('Group 1:');
            expect(names[1]).toBe('Group 2:');
        });

        it('marks all fields as inline', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D']);
            const allInline = embed.data.fields?.every((f) => f.inline === true) ?? false;
            expect(allInline).toBe(true);
        });
    });

    describe('reroll footer', () => {
        it('has no footer when rerollAmount is not given', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D']);
            expect(embed.data.footer).toBeUndefined();
        });

        it('includes a footer when rerollAmount is provided', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D'], 1);
            expect(embed.data.footer?.text).toContain('1');
        });

        it('uses singular "time" for rerollAmount = 1', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D'], 1);
            expect(embed.data.footer?.text).toMatch(/Rerolled 1 time\./);
        });

        it('uses plural "times" for rerollAmount > 1', () => {
            const embed = generateEmbed(2, ['A', 'B', 'C', 'D'], 3);
            expect(embed.data.footer?.text).toMatch(/Rerolled 3 times\./);
        });
    });

    describe('returns EmbedBuilder instance', () => {
        it('result is an EmbedBuilder', () => {
            const embed = generateEmbed(2, ['A', 'B']);
            expect(embed).toBeInstanceOf(EmbedBuilder);
        });
    });
});
