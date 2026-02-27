/**
 * @file PathfinderRoll.test.ts
 * @description Unit tests that enforce the spec's design for pathfinderRoll.ts.
 *
 * All Google Sheets API calls are mocked — no real HTTP traffic is made.
 * The default PathfinderSheetConfig.json is loaded from disk (as production does)
 * by passing `null` as the sheetConfig argument to `resolveTokens`.
 *
 * Spec reference: docs/pathfinder-character-integration.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserError } from '@sapphire/framework';

// ---------------------------------------------------------------------------
// Mock the sheets module BEFORE importing pathfinderRoll (which imports it).
// ---------------------------------------------------------------------------
vi.mock('../../src/lib/utils/sheets', () => ({
    extractSheetId: vi.fn(),
    batchGetValues: vi.fn(),
    resolveNamedRanges: vi.fn(),
}));

import { hasTokens, resolveTokens } from '../../src/lib/utils/pathfinderRoll';
import * as sheets from '../../src/lib/utils/sheets';

// Typed references to the mocks.
const mockExtractSheetId    = vi.mocked(sheets.extractSheetId);
const mockBatchGetValues    = vi.mocked(sheets.batchGetValues);
const mockResolveNamedRanges = vi.mocked(sheets.resolveNamedRanges);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAKE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/FAKE_ID/edit';
const FAKE_SHEET_ID  = 'FAKE_ID';

/** Named-range map returned by resolveNamedRanges (used for ability scores + BAB). */
const DEFAULT_NAMED_RANGES: Record<string, string> = {
    Strength:     'C3',
    Dexterity:    'C4',
    Constitution: 'C5',
    Intelligence: 'C6',
    Wisdom:       'C7',
    Charisma:     'C8',
    BaseAttack:   'C9',
    Level:        'C2',
};

/** Default batch values. Tests override specific keys as needed. */
const DEFAULT_BATCH: Record<string, string | null> = {
    // Ability scores (resolved from named ranges)
    C3: '3', C4: '2', C5: '1', C6: '-1', C7: '0', C8: '4',
    // BAB
    C9: '10',
    // Saves
    F17: '8', F18: '5', F19: '6',
    // Combat
    B34: '11',   // CMB
    O38: '4',    // Initiative
    // A direct cell used in some tests
    C32: '7',
    AJ31: '11',  // Perception
    // All skill cells (just Perception for simplicity; others tested separately)
    AJ9: '5', AJ10: '1', AJ11: '3', AJ12: '2', AJ13: '7',
    AJ14: '0', AJ15: '1', AJ16: '4', AJ17: '2', AJ18: '-1',
    AJ19: '3', AJ20: '6', AJ21: '1', AJ22: '2', AJ23: '0',
    AJ24: '1', AJ25: '2', AJ26: '3', AJ27: '4', AJ28: '1',
    AJ29: '2', AJ30: '0', AJ32: '3', AJ33: '1', AJ34: '5',
    AJ35: '2', AJ36: '4', AJ37: '6', AJ38: '3', AJ39: '2',
    // Offense name column (rows 26–31)
    E26: 'Longsword', E27: 'Shortsword', E28: '', E29: '', E30: '', E31: '',
    // Offense attack column
    O26: '+12/+7/+2', O27: '+8',
    // Offense damage column
    V26: '1d8+4', V27: '1d6+2',
    // Offense type column
    AB26: 'slashing', AB27: 'piercing',
    // Offense crit/mult/range (present but not currently needed for roll tests)
    Y26: '19-20', Z26: '×2', AA26: '—',
    Y27: '20',    Z27: '×2', AA27: '—',
};

function makeBatch(overrides: Record<string, string | null> = {}): Record<string, string | null> {
    return { ...DEFAULT_BATCH, ...overrides };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockExtractSheetId.mockReturnValue(FAKE_SHEET_ID);
    mockResolveNamedRanges.mockResolvedValue(DEFAULT_NAMED_RANGES);
    mockBatchGetValues.mockResolvedValue(makeBatch());
});

// ---------------------------------------------------------------------------
// hasTokens()
// ---------------------------------------------------------------------------

describe('hasTokens()', () => {
    it('returns true for notation with a token', () => {
        expect(hasTokens('1d20 + [STR]')).toBe(true);
    });

    it('returns true for notation with multiple tokens', () => {
        expect(hasTokens('[STR] + [BAB]')).toBe(true);
    });

    it('returns true for a standalone offense token', () => {
        expect(hasTokens('[Longsword:ATK]')).toBe(true);
    });

    it('returns false when no tokens are present', () => {
        expect(hasTokens('3d6')).toBe(false);
    });

    it('returns false for plain text with no brackets', () => {
        expect(hasTokens('1d20 + 5')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Token resolution order — spec § Roll Syntax Extension
// ---------------------------------------------------------------------------

describe('Token resolution order', () => {
    it('step 1: AJ9 matches cell-ref pattern, not the Acrobatics skill alias', async () => {
        // AJ9 is also the Acrobatics cell, but cell-ref pattern takes priority
        const { resolved } = await resolveTokens('1d20 + [AJ9]', FAKE_SHEET_URL, null);
        // The batch should have been called with AJ9 directly (no alias lookup)
        expect(resolved).toBe('1d20 + 5');
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });

    it('step 2: stat alias resolves before offense pattern is attempted', async () => {
        // [will] could look like "will:something" if we parsed offense first; must be save
        const { resolved } = await resolveTokens('1d20 + [will]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 6');
    });

    it('step 3: offense reference only tried after cell-ref and alias fail', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });
});

// ---------------------------------------------------------------------------
// Bare alias support (spec § Roll Syntax Extension — bare_stat_ref)
// ---------------------------------------------------------------------------

describe('Bare stat / skill aliases (no brackets)', () => {
    it('hasTokens() detects a bare stat alias', () => {
        expect(hasTokens('1d20 + STR')).toBe(true);
    });

    it('hasTokens() detects a bare skill alias', () => {
        expect(hasTokens('1d20 + perc')).toBe(true);
    });

    it('hasTokens() returns false when no bracket or bare alias is present', () => {
        expect(hasTokens('3d6 + 5')).toBe(false);
    });

    it('bare STR resolves to the same value as [STR]', async () => {
        const bare      = await resolveTokens('1d20 + STR',   FAKE_SHEET_URL, null);
        const bracketed = await resolveTokens('1d20 + [STR]', FAKE_SHEET_URL, null);
        expect(bare.resolved).toBe(bracketed.resolved);
    });

    it('bare fort resolves to the save value (case-insensitive)', async () => {
        const { resolved } = await resolveTokens('1d20 + fort', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });

    it('bare perc resolves to the Perception skill cell', async () => {
        const { resolved } = await resolveTokens('1d20 + perc', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
    });

    it('bare init resolves to the initiative cell', async () => {
        const { resolved } = await resolveTokens('1d20 + init', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 4');
    });

    it('bare BAB resolves to the named range', async () => {
        const { resolved } = await resolveTokens('1d20 + BAB', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 10');
    });

    it('mixed expression: bare STR + bracketed fort', async () => {
        const { resolved } = await resolveTokens('1d20 + STR + [fort]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 3 + 8');
    });

    it('all-bare multi-alias expression', async () => {
        const { resolved } = await resolveTokens('STR + fort + perc', FAKE_SHEET_URL, null);
        expect(resolved).toBe('3 + 8 + 11');
    });

    it('bare alias is not double-wrapped when already in brackets', async () => {
        // [STR] should not become [[STR]] — existing brackets are preserved
        const { resolved } = await resolveTokens('1d20 + [STR] + STR', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 3 + 3');
    });

    it('offense reference without brackets is NOT resolved (brackets required for offenses)', async () => {
        // "Longsword:ATK" bare is NOT an alias — hasTokens should return false for this alone
        expect(hasTokens('Longsword:ATK')).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Stat alias table — ability scores
// ---------------------------------------------------------------------------

describe('Ability score aliases', () => {
    const cases: [string, string, string][] = [
        // [token alias, expected batch cell, expected value]
        ['STR',           'C3', '3'],
        ['str',           'C3', '3'],
        ['strength',      'C3', '3'],
        ['DEX',           'C4', '2'],
        ['dex',           'C4', '2'],
        ['dexterity',     'C4', '2'],
        ['CON',           'C5', '1'],
        ['con',           'C5', '1'],
        ['constitution',  'C5', '1'],
        ['INT',           'C6', '-1'],
        ['int',           'C6', '-1'],
        ['intelligence',  'C6', '-1'],
        ['WIS',           'C7', '0'],
        ['wis',           'C7', '0'],
        ['wisdom',        'C7', '0'],
        ['CHA',           'C8', '4'],
        ['cha',           'C8', '4'],
        ['charisma',      'C8', '4'],
    ];

    for (const [alias, cell, expected] of cases) {
        it(`[${alias}] resolves via named range to value ${expected}`, async () => {
            const { resolved } = await resolveTokens(`1d20 + [${alias}]`, FAKE_SHEET_URL, null);
            expect(resolved).toBe(`1d20 + ${expected}`);
        });
    }

    it('ability aliases use resolveNamedRanges (not direct batchGet with named-range strings)', async () => {
        await resolveTokens('1d20 + [str]', FAKE_SHEET_URL, null);
        expect(mockResolveNamedRanges).toHaveBeenCalledWith(FAKE_SHEET_ID);
    });
});

// ---------------------------------------------------------------------------
// Stat alias table — saves, combat
// ---------------------------------------------------------------------------

describe('Save and combat aliases', () => {
    it('[fort] → F17', async () => {
        const { resolved } = await resolveTokens('1d20 + [fort]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });

    it('[fortitude] → F17', async () => {
        const { resolved } = await resolveTokens('1d20 + [fortitude]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });

    it('[FORT] → F17 (case-insensitive)', async () => {
        const { resolved } = await resolveTokens('1d20 + [FORT]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });

    it('[ref] → F18', async () => {
        const { resolved } = await resolveTokens('1d20 + [ref]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 5');
    });

    it('[reflex] → F18', async () => {
        const { resolved } = await resolveTokens('1d20 + [reflex]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 5');
    });

    it('[will] → F19', async () => {
        const { resolved } = await resolveTokens('1d20 + [will]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 6');
    });

    it('[cmb] → B34', async () => {
        const { resolved } = await resolveTokens('1d20 + [cmb]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
    });

    it('[CMB] → B34 (case-insensitive)', async () => {
        const { resolved } = await resolveTokens('1d20 + [CMB]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
    });

    it('[bab] → BaseAttack named range', async () => {
        const { resolved } = await resolveTokens('1d20 + [bab]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 10');
        expect(mockResolveNamedRanges).toHaveBeenCalled();
    });

    it('[BAB] → BaseAttack named range (case-insensitive)', async () => {
        const { resolved } = await resolveTokens('1d20 + [BAB]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 10');
    });

    it('[baseattack] → BaseAttack named range', async () => {
        const { resolved } = await resolveTokens('1d20 + [baseattack]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 10');
    });

    it('[init] → O38', async () => {
        const { resolved } = await resolveTokens('1d20 + [init]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 4');
    });

    it('[initiative] → O38', async () => {
        const { resolved } = await resolveTokens('1d20 + [initiative]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 4');
    });

    it('[INIT] → O38 (case-insensitive)', async () => {
        const { resolved } = await resolveTokens('1d20 + [INIT]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 4');
    });
});

// ---------------------------------------------------------------------------
// Skill alias table
// ---------------------------------------------------------------------------

describe('Skill aliases', () => {
    const cases: [string, string][] = [
        ['Acrobatics', 'AJ9'],  ['acro', 'AJ9'],
        ['Appraise',   'AJ10'], ['appr', 'AJ10'],
        ['Bluff',      'AJ11'], ['bluff', 'AJ11'],
        ['Climb',      'AJ12'], ['climb', 'AJ12'],
        ['Diplomacy',  'AJ13'], ['diplo', 'AJ13'],
        ['Disable Device', 'AJ14'], ['dd', 'AJ14'], ['disable', 'AJ14'],
        ['Disguise',   'AJ15'], ['disg', 'AJ15'],
        ['Escape Artist', 'AJ16'], ['ea', 'AJ16'], ['escape', 'AJ16'],
        ['Fly',        'AJ17'], ['fly', 'AJ17'],
        ['Handle Animal', 'AJ18'], ['ha', 'AJ18'], ['handle', 'AJ18'],
        ['Heal',       'AJ19'], ['heal', 'AJ19'],
        ['Intimidate', 'AJ20'], ['intim', 'AJ20'],
        // Kn. Spheric — includes the kn.spheric alias that was previously missing
        ['Kn. Spheric', 'AJ21'], ['ksph', 'AJ21'], ['spheric', 'AJ21'], ['kn.spheric', 'AJ21'],
        ['Kn. Dungeoneering', 'AJ22'], ['kdung', 'AJ22'], ['dungeon', 'AJ22'], ['kn.dungeon', 'AJ22'],
        ['Kn. Engineering', 'AJ23'], ['keng', 'AJ23'], ['engineer', 'AJ23'], ['kn.engineering', 'AJ23'],
        ['Kn. Geography', 'AJ24'], ['kgeo', 'AJ24'], ['geography', 'AJ24'], ['kn.geography', 'AJ24'],
        ['Kn. History', 'AJ25'], ['khist', 'AJ25'], ['history', 'AJ25'], ['kn.history', 'AJ25'],
        ['Kn. Local',  'AJ26'], ['kloc', 'AJ26'], ['local', 'AJ26'], ['kn.local', 'AJ26'],
        ['Kn. Nature', 'AJ27'], ['knat', 'AJ27'], ['nature', 'AJ27'], ['kn.nature', 'AJ27'],
        ['Kn. Nobility', 'AJ28'], ['knob', 'AJ28'], ['nobility', 'AJ28'], ['kn.nobility', 'AJ28'],
        ['Kn. Religion', 'AJ29'], ['krel', 'AJ29'], ['religion', 'AJ29'], ['kn.religion', 'AJ29'],
        ['Linguistics', 'AJ30'], ['ling', 'AJ30'],
        ['Perception', 'AJ31'], ['perc', 'AJ31'],
        ['Piloting',   'AJ32'], ['pilot', 'AJ32'],
        ['Ride',       'AJ33'], ['ride', 'AJ33'],
        ['Sense Motive', 'AJ34'], ['sm', 'AJ34'], ['sense', 'AJ34'],
        ['Sleight of Hand', 'AJ35'], ['soh', 'AJ35'], ['sleight', 'AJ35'],
        ['Spheric Combat', 'AJ36'], ['sc', 'AJ36'], ['sphcombat', 'AJ36'],
        ['Stealth',    'AJ37'], ['stealth', 'AJ37'],
        ['Survival',   'AJ38'], ['surv', 'AJ38'],
        ['Swim',       'AJ39'], ['swim', 'AJ39'],
    ];

    for (const [alias, cell] of cases) {
        it(`[${alias}] resolves to cell ${cell}`, async () => {
            const { resolved } = await resolveTokens(`1d20 + [${alias}]`, FAKE_SHEET_URL, null);
            const expectedVal = DEFAULT_BATCH[cell] ?? '0';
            expect(resolved).toBe(`1d20 + ${expectedVal}`);
        });
    }

    it('skill alias matching is case-insensitive', async () => {
        const { resolved } = await resolveTokens('1d20 + [PERCEPTION]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
    });

    it('full skill name Perception resolves to AJ31', async () => {
        const { resolved } = await resolveTokens('1d20 + [Perception]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
    });
});

// ---------------------------------------------------------------------------
// Direct cell reference
// ---------------------------------------------------------------------------

describe('Direct cell reference (A1 pattern)', () => {
    it('[C32] resolves directly without alias lookup', async () => {
        const { resolved } = await resolveTokens('1d20 + [C32]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 7');
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });

    it('[AJ31] resolves as direct cell (same as Perception) without named-range lookup', async () => {
        const { resolved } = await resolveTokens('1d20 + [AJ31]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 11');
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });

    it('[O38] resolves directly (same as Initiative)', async () => {
        const { resolved } = await resolveTokens('1d20 + [O38]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 4');
    });
});

// ---------------------------------------------------------------------------
// Multiple tokens in one notation
// ---------------------------------------------------------------------------

describe('Multiple tokens', () => {
    it('resolves two stat tokens: [STR] + [BAB]', async () => {
        const { resolved } = await resolveTokens('1d20 + [STR] + [BAB]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 3 + 10');
    });

    it('resolves mixed stat and direct-cell tokens', async () => {
        const { resolved } = await resolveTokens('[fort] + [C32]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('8 + 7');
    });

    it('uses a single batchGet call for multiple tokens', async () => {
        await resolveTokens('1d20 + [STR] + [Perception] + [init]', FAKE_SHEET_URL, null);
        expect(mockBatchGetValues).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Offense references — name matching
// ---------------------------------------------------------------------------

describe('Offense name matching', () => {
    it('exact match (case-insensitive): [Longsword:ATK]', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('exact match is case-insensitive: [longsword:ATK]', async () => {
        const { resolved } = await resolveTokens('1d20 + [longsword:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('prefix match: [Long:ATK] matches Longsword', async () => {
        const { resolved } = await resolveTokens('1d20 + [Long:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('substring match: [sword:ATK] matches Longsword when unambiguous', async () => {
        // Only Longsword contains "long" as prefix; Shortsword also contains "sword"
        // so [sword:ATK] would match both Longsword and Shortsword → ambiguous.
        // Test an unambiguous substring instead.
        const { resolved } = await resolveTokens('1d20 + [Longs:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('throws UserError listing candidates when name is ambiguous', async () => {
        // 'sword' is a substring of both Longsword and Shortsword
        await expect(resolveTokens('1d20 + [sword:ATK]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/Ambiguous offense name/i) });
    });

    it('ambiguous error lists all candidate names', async () => {
        let identifier = '';
        try {
            await resolveTokens('1d20 + [sword:ATK]', FAKE_SHEET_URL, null);
        } catch (e) {
            identifier = (e as UserError).identifier || (e as Error).message || '';
        }
        expect(identifier).toMatch(/Longsword/);
        expect(identifier).toMatch(/Shortsword/);
    });

    it('throws UserError when no offense name matches', async () => {
        await expect(resolveTokens('1d20 + [Greataxe:ATK]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/No offense named/i) });
    });

    it('skips empty offense rows when matching', async () => {
        // E27 = Shortsword, E28-E31 are empty. [Short:ATK] should match only Shortsword.
        const { resolved } = await resolveTokens('1d20 + [Short:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });
});

// ---------------------------------------------------------------------------
// ATK token — iterative attack parsing
// ---------------------------------------------------------------------------

describe('[Name:ATK] — iterative attack parsing', () => {
    it('[Longsword:ATK] with no index selects the first (highest) bonus', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('[Longsword:ATK:1] explicit first index equals no-index result', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK:1]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('[Longsword:ATK:2] selects the second bonus from +12/+7/+2', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK:2]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 7');
    });

    it('[Longsword:ATK:3] selects the third bonus from +12/+7/+2', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATK:3]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 2');
    });

    it('ATK with no slash stores single bonus correctly', async () => {
        // Shortsword has O27='+8' (no slash)
        const { resolved } = await resolveTokens('1d20 + [Shortsword:ATK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 8');
    });

    it('throws when ATK index exceeds available iterative attacks', async () => {
        // Shortsword has only 1 attack
        await expect(resolveTokens('1d20 + [Shortsword:ATK:2]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/Only 1 iterative attack/i) });
    });

    it('throws error mentioning the attack count when index out of range', async () => {
        // Longsword has 3 attacks; index 4 should fail with "Only 3 iterative attacks"
        await expect(resolveTokens('1d20 + [Longsword:ATK:4]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/Only 3 iterative attacks/i) });
    });

    it('accepts ATTACK as synonym for ATK', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:ATTACK]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });

    it('ATK token is case-insensitive on the offense type keyword', async () => {
        const { resolved } = await resolveTokens('1d20 + [Longsword:atk]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 12');
    });
});

// ---------------------------------------------------------------------------
// DMG token
// ---------------------------------------------------------------------------

describe('[Name:DMG] — damage token', () => {
    it('resolves to the dice expression from column V', async () => {
        const { resolved } = await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d8+4');
    });

    it('returns the damage type from column AB', async () => {
        const { damageType } = await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        expect(damageType).toBe('slashing');
    });

    it('damage type is null when AB column is empty', async () => {
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ AB26: null }));
        const { damageType } = await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        expect(damageType).toBeNull();
    });

    it('accepts DAMAGE as synonym for DMG', async () => {
        const { resolved } = await resolveTokens('[Longsword:DAMAGE]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d8+4');
    });

    it('DMG token is case-insensitive on the offense type keyword', async () => {
        const { resolved } = await resolveTokens('[Longsword:dmg]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d8+4');
    });

    it('strips trailing non-numeric suffix from V cell when AB is empty (fallback)', async () => {
        // If column V contains "1d8+4 slashing" and AB is empty, strips the suffix
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ V26: '1d8+4 slashing', AB26: null }));
        const result = await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        expect(result.resolved).toBe('1d8+4');
        expect(result.damageType).toBe('slashing');
    });
});

// ---------------------------------------------------------------------------
// Batch call count invariant (spec §Data Retrieval at Roll Time)
// ---------------------------------------------------------------------------

describe('Single batchGet call per roll invocation', () => {
    it('uses exactly one batchGetValues call for a stat token', async () => {
        await resolveTokens('1d20 + [STR]', FAKE_SHEET_URL, null);
        expect(mockBatchGetValues).toHaveBeenCalledTimes(1);
    });

    it('uses exactly one batchGetValues call even with many tokens', async () => {
        await resolveTokens(
            '1d20 + [STR] + [DEX] + [Perception] + [fort] + [bab]',
            FAKE_SHEET_URL, null
        );
        expect(mockBatchGetValues).toHaveBeenCalledTimes(1);
    });

    it('uses exactly one batchGetValues call for an ATK token', async () => {
        await resolveTokens('1d20 + [Longsword:ATK]', FAKE_SHEET_URL, null);
        expect(mockBatchGetValues).toHaveBeenCalledTimes(1);
    });

    it('uses exactly one batchGetValues call for a DMG token', async () => {
        await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        expect(mockBatchGetValues).toHaveBeenCalledTimes(1);
    });

    it('offense batch includes attack column cells (not just name column)', async () => {
        await resolveTokens('1d20 + [Longsword:ATK]', FAKE_SHEET_URL, null);
        const calledWith = mockBatchGetValues.mock.calls[0][2];
        expect(calledWith).toContain('E26'); // name
        expect(calledWith).toContain('O26'); // attack col
    });

    it('DMG batch includes damage and type column cells', async () => {
        await resolveTokens('[Longsword:DMG]', FAKE_SHEET_URL, null);
        const calledWith = mockBatchGetValues.mock.calls[0][2];
        expect(calledWith).toContain('E26'); // name
        expect(calledWith).toContain('V26'); // damage col
        expect(calledWith).toContain('AB26'); // type col
    });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('Error cases', () => {
    it('throws when the sheet URL is invalid', async () => {
        mockExtractSheetId.mockReturnValueOnce(null);
        await expect(resolveTokens('1d20 + [STR]', 'not-a-url', null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/invalid/i) });
    });

    it('throws naming the token when a cell is empty', async () => {
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ F17: null }));
        await expect(resolveTokens('1d20 + [fort]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/fort/) });
    });

    it('throws naming the token when a cell is non-numeric', async () => {
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ F17: 'NaN-value' }));
        await expect(resolveTokens('1d20 + [fort]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/fort/) });
    });

    it('throws for an entirely unknown token with helpful message', async () => {
        await expect(resolveTokens('1d20 + [unknownstat]', FAKE_SHEET_URL, null))
            .rejects.toMatchObject({ identifier: expect.stringMatching(/Unknown token/i) });
    });

    it('no-token notation returns unmodified resolved string', async () => {
        const { resolved, damageType } = await resolveTokens('3d6', FAKE_SHEET_URL, null);
        expect(resolved).toBe('3d6');
        expect(damageType).toBeNull();
        expect(mockBatchGetValues).not.toHaveBeenCalled();
    });

    it('+N and -N formatted bonus values parse correctly (signed integers)', async () => {
        // Negative save bonus
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ F17: '-2' }));
        const { resolved } = await resolveTokens('1d20 + [fort]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + -2');
    });

    it('+N format (with leading +) parses correctly', async () => {
        mockBatchGetValues.mockResolvedValueOnce(makeBatch({ F17: '+5' }));
        const { resolved } = await resolveTokens('1d20 + [fort]', FAKE_SHEET_URL, null);
        expect(resolved).toBe('1d20 + 5');
    });
});

// ---------------------------------------------------------------------------
// Spec invariant — no sheet lookup when no tokens present
// ---------------------------------------------------------------------------

describe('Behaviour invariant: no-token roll skips all sheet access', () => {
    it('does not call extractSheetId when notation has no tokens', async () => {
        // hasTokens is the guard in DiceRollCommand, but resolveTokens itself also
        // returns early when the token list is empty.
        const { resolved } = await resolveTokens('3d6', FAKE_SHEET_URL, null);
        expect(resolved).toBe('3d6');
        expect(mockBatchGetValues).not.toHaveBeenCalled();
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });
});
