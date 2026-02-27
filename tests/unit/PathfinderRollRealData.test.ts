/**
 * @file PathfinderRollRealData.test.ts
 * @description Unit tests that validate `resolveTokens()` against the real cell
 *              values snapshotted from all six registered character sheets.
 *
 * Google Sheets API calls are **fully mocked** — no HTTP traffic is made.
 * The mock returns the actual values fetched earlier by tests/scripts/fetchSheetFixtures.cjs.
 *
 * Purpose: verify that parsing logic produces the correct numeric substitutions
 * when faced with real-world data rather than synthetic fixtures.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserError } from '@sapphire/framework';

// Mock the sheets module BEFORE importing pathfinderRoll.
vi.mock('../../src/lib/utils/sheets', () => ({
    extractSheetId: vi.fn(),
    batchGetValues: vi.fn(),
    resolveNamedRanges: vi.fn(),
}));

import { resolveTokens } from '../../src/lib/utils/pathfinderRoll';
import * as sheets from '../../src/lib/utils/sheets';
import { SHEET_FIXTURES, type SheetFixture } from '../fixtures/sheetData';

const mockExtractSheetId     = vi.mocked(sheets.extractSheetId);
const mockBatchGetValues     = vi.mocked(sheets.batchGetValues);
const mockResolveNamedRanges = vi.mocked(sheets.resolveNamedRanges);

// ---------------------------------------------------------------------------
// Helper — configure all three mocks with a fixture's real data.
// ---------------------------------------------------------------------------
function useMocks(fixture: SheetFixture): void {
    mockExtractSheetId.mockReturnValue(fixture.spreadsheetId);
    mockResolveNamedRanges.mockResolvedValue(fixture.namedRanges);
    mockBatchGetValues.mockResolvedValue(fixture.cells as Record<string, string>);
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ============================================================================
// Sheet 1 — Barbarian-type fighter, six weapons including unusual damage dice
// ============================================================================

describe('Sheet1 — real data', () => {
    const fx = SHEET_FIXTURES[0];

    beforeEach(() => useMocks(fx));

    // Ability scores
    it('[STR] resolves to 6', async () => {
        const { resolved } = await resolveTokens('1d20 + [STR]', fx.url, null);
        expect(resolved).toBe('1d20 + 6');
    });
    it('[DEX] resolves to 2', async () => {
        const { resolved } = await resolveTokens('[DEX]', fx.url, null);
        expect(resolved).toBe('2');
    });
    it('[CON] resolves to 2', async () => {
        const { resolved } = await resolveTokens('[CON]', fx.url, null);
        expect(resolved).toBe('2');
    });
    it('[INT] resolves to -2', async () => {
        const { resolved } = await resolveTokens('[INT]', fx.url, null);
        expect(resolved).toBe('-2');
    });
    it('[WIS] resolves to 0', async () => {
        const { resolved } = await resolveTokens('[WIS]', fx.url, null);
        expect(resolved).toBe('0');
    });
    it('[CHA] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[CHA]', fx.url, null);
        expect(resolved).toBe('6');
    });

    // Saves
    it('[fort] resolves to 16', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('16');
    });
    it('[ref] resolves to 12', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('12');
    });
    it('[will] resolves to 15', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('15');
    });

    // Combat stats
    it('[BAB] resolves to 8 (via named range BaseAttack → AM6)', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('8');
    });
    it('[CMB] resolves to 14', async () => {
        const { resolved } = await resolveTokens('[CMB]', fx.url, null);
        expect(resolved).toBe('14');
    });
    it('[init] resolves to 2', async () => {
        const { resolved } = await resolveTokens('[init]', fx.url, null);
        expect(resolved).toBe('2');
    });

    // Skills
    it('[perc] resolves to 0', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('0');
    });
    it('[acro] resolves to 3', async () => {
        const { resolved } = await resolveTokens('[acro]', fx.url, null);
        expect(resolved).toBe('3');
    });

    // Offense — Kukri (row 3, E28)
    it('[Kukri:ATK] resolves first attack (+15)', async () => {
        const { resolved } = await resolveTokens('1d20 + [Kukri:ATK]', fx.url, null);
        expect(resolved).toBe('1d20 + 15');
    });
    it('[Kukri:ATK:2] resolves second attack (+10)', async () => {
        const { resolved } = await resolveTokens('1d20 + [Kukri:ATK:2]', fx.url, null);
        expect(resolved).toBe('1d20 + 10');
    });
    it('[Kukri:DMG] resolves to damage expression and type S', async () => {
        const { resolved, damageType } = await resolveTokens('[Kukri:DMG]', fx.url, null);
        expect(resolved).toBe('1d4 + 7');
        expect(damageType).toBe('S');
    });

    // Offense — +1 Flaming Greataxe (row 1, E26) — damage includes extra die
    it('[greataxe:ATK] prefix-matches "+1 Flaming Greataxe", first attack', async () => {
        const { resolved } = await resolveTokens('[greataxe:ATK]', fx.url, null);
        expect(resolved).toBe('16');
    });
    it('[greataxe:ATK:2] resolves second attack (+8)', async () => {
        const { resolved } = await resolveTokens('[greataxe:ATK:2]', fx.url, null);
        expect(resolved).toBe('8');
    });
    it('[greataxe:DMG] returns multi-die expression', async () => {
        const { resolved } = await resolveTokens('[greataxe:DMG]', fx.url, null);
        expect(resolved).toBe('1d12+1d6 + 11');
    });

    // Offense — Punch (row 4, E29)
    it('[Punch:ATK] resolves to 15', async () => {
        const { resolved } = await resolveTokens('[Punch:ATK]', fx.url, null);
        expect(resolved).toBe('15');
    });
    it('[Punch:DMG] type is B', async () => {
        const { resolved, damageType } = await resolveTokens('[Punch:DMG]', fx.url, null);
        expect(resolved).toBe('1d3 + 7');
        expect(damageType).toBe('B');
    });

    // Offense — MWK Gundrill (row 2, E27) — AB27 is null
    it('[Gundrill:DMG] has null damageType when type cell is empty', async () => {
        const { resolved, damageType } = await resolveTokens('[Gundrill:DMG]', fx.url, null);
        expect(resolved).toBe('2d6 / 3d6 + 10');
        expect(damageType).toBeNull();
    });

    // Error — out-of-range attack index
    it('[Kukri:ATK:3] throws when only 2 iterative attacks exist', async () => {
        await expect(resolveTokens('[Kukri:ATK:3]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Only 2 iterative attack') });
    });
});

// ============================================================================
// Sheet 2 — Gunslinger/arcane, null CMB cell
// ============================================================================

describe('Sheet2 — real data', () => {
    const fx = SHEET_FIXTURES[1];

    beforeEach(() => useMocks(fx));

    // Ability scores
    it('[STR] resolves to -1', async () => {
        const { resolved } = await resolveTokens('[STR]', fx.url, null);
        expect(resolved).toBe('-1');
    });
    it('[DEX] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[DEX]', fx.url, null);
        expect(resolved).toBe('5');
    });
    it('[INT] resolves to 7', async () => {
        const { resolved } = await resolveTokens('[INT]', fx.url, null);
        expect(resolved).toBe('7');
    });

    // Saves
    it('[fort] resolves to 9', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('9');
    });
    it('[ref] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('10');
    });
    it('[will] resolves to 15', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('15');
    });

    // CMB cell is null → should throw
    it('[CMB] throws because B34 is empty', async () => {
        await expect(resolveTokens('[CMB]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('empty cell') });
    });

    // Skills
    it('[perc] resolves to 19', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('19');
    });
    it('[acro] resolves to 12', async () => {
        const { resolved } = await resolveTokens('[acro]', fx.url, null);
        expect(resolved).toBe('12');
    });

    // BAB
    it('[BAB] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('5');
    });

    // Offense — Pistol Shooting (single attack, no iteratives)
    it('[Pistol:ATK] prefix-matches "Pistol Shooting"', async () => {
        const { resolved } = await resolveTokens('[Pistol:ATK]', fx.url, null);
        expect(resolved).toBe('12');
    });
    it('[Pistol:DMG] has damageType BP', async () => {
        const { resolved, damageType } = await resolveTokens('[Pistol:DMG]', fx.url, null);
        expect(resolved).toBe('1d8 + 2');
        expect(damageType).toBe('BP');
    });

    // Offense — Dagger (exact match)
    it('[Dagger:ATK] exact-matches "Dagger"', async () => {
        const { resolved } = await resolveTokens('[Dagger:ATK]', fx.url, null);
        expect(resolved).toBe('11');
    });
    it('[Dagger:ATK:2] throws — only 1 attack listed', async () => {
        await expect(resolveTokens('[Dagger:ATK:2]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Only 1 iterative attack') });
    });

    // Offense — Draconic Claws (AB31 = BPS)
    it('[Draconic:DMG] has damageType BPS', async () => {
        const { resolved, damageType } = await resolveTokens('[Draconic:DMG]', fx.url, null);
        expect(resolved).toBe('1d4 + 7');
        expect(damageType).toBe('BPS');
    });

    // Offense — Ancient Tech Gun
    it('[Ancient Tech:ATK] substring-matches "Ancient Tech Gun"', async () => {
        const { resolved } = await resolveTokens('[Ancient Tech:ATK]', fx.url, null);
        expect(resolved).toBe('11');
    });

    // Error — "CMB" weapon row (E29="CMB") vs [cmb] stat alias
    // The stat alias B34 is null; the weapon row O29="+5" is NOT used for stat lookups.
    it('[cmb] stat alias uses B34 (null), not the offense row', async () => {
        await expect(resolveTokens('[cmb]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('empty cell') });
    });
});

// ============================================================================
// Sheet 3 — Investigator with negative saves
// ============================================================================

describe('Sheet3 — real data', () => {
    const fx = SHEET_FIXTURES[2];

    beforeEach(() => useMocks(fx));

    it('[STR] resolves to 1', async () => {
        const { resolved } = await resolveTokens('[STR]', fx.url, null);
        expect(resolved).toBe('1');
    });
    it('[CHA] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[CHA]', fx.url, null);
        expect(resolved).toBe('6');
    });

    it('[fort] resolves to -1 (negative save)', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('-1');
    });
    it('[will] resolves to -3 (negative save)', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('-3');
    });

    it('[BAB] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('10');
    });
    it('[CMB] resolves to 11', async () => {
        const { resolved } = await resolveTokens('[CMB]', fx.url, null);
        expect(resolved).toBe('11');
    });

    it('[perc] resolves to -2', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('-2');
    });

    // Offense — Railknife (two identical rows, melee & ranged)
    it('[Railknife (Melee):ATK] exact-matches row 1', async () => {
        const { resolved } = await resolveTokens('[Railknife (Melee):ATK]', fx.url, null);
        expect(resolved).toBe('14');
    });
    it('[Railknife (Melee):ATK:2] resolves second attack (+9)', async () => {
        const { resolved } = await resolveTokens('[Railknife (Melee):ATK:2]', fx.url, null);
        expect(resolved).toBe('9');
    });
    it('[Railknife (Ranged):DMG] resolves damage formula', async () => {
        const { resolved, damageType } = await resolveTokens('[Railknife (Ranged):DMG]', fx.url, null);
        expect(resolved).toBe('1d4 + 14');
        expect(damageType).toBe('P');
    });

    // Ambiguity: querying "railknife" matches both melee and ranged rows
    it('[Railknife:ATK] throws ambiguous error for "Railknife"', async () => {
        await expect(resolveTokens('[Railknife:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Ambiguous offense name') });
    });
});

// ============================================================================
// Sheet 4 — Investigator/swashbuckler with high DEX
// ============================================================================

describe('Sheet4 — real data', () => {
    const fx = SHEET_FIXTURES[3];

    beforeEach(() => useMocks(fx));

    it('[DEX] resolves to 7', async () => {
        const { resolved } = await resolveTokens('[DEX]', fx.url, null);
        expect(resolved).toBe('7');
    });
    it('[INT] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[INT]', fx.url, null);
        expect(resolved).toBe('5');
    });

    it('[ref] resolves to 18 (highest reflex in the set)', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('18');
    });
    it('[will] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('10');
    });

    it('[init] resolves to 7', async () => {
        const { resolved } = await resolveTokens('[init]', fx.url, null);
        expect(resolved).toBe('7');
    });
    it('[perc] resolves to 12', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('12');
    });

    // Offense — (+4) Keen Rapier (row 2, highest ATK)
    it('[(+4) Keen Rapier:ATK] resolves to 20', async () => {
        const { resolved } = await resolveTokens('[(+4) Keen Rapier:ATK]', fx.url, null);
        expect(resolved).toBe('20');
    });
    it('[(+4) Keen Rapier:ATK:2] resolves to 15', async () => {
        const { resolved } = await resolveTokens('[(+4) Keen Rapier:ATK:2]', fx.url, null);
        expect(resolved).toBe('15');
    });
    it('[(+4) Keen Rapier:DMG] returns formula and type P', async () => {
        const { resolved, damageType } = await resolveTokens('[(+4) Keen Rapier:DMG]', fx.url, null);
        expect(resolved).toBe('1d6 + 12');
        expect(damageType).toBe('P');
    });

    // Offense — substring match on "Wrist"
    it('[Wrist:ATK] substring-matches "(MW) Wrist Launcher, Heavy"', async () => {
        const { resolved } = await resolveTokens('[Wrist:ATK]', fx.url, null);
        expect(resolved).toBe('16');
    });

    // Rapier ambiguity: "rapier" matches both "Keen Rapier" and "Cold Iron Rapier"
    it('[Rapier:ATK] throws ambiguous for "rapier" substring', async () => {
        await expect(resolveTokens('[Rapier:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Ambiguous offense name') });
    });

    // Studied Strike has no attack cell (O29 = null) → ATK should throw
    it('[Studied Strike:ATK] throws because O29 is null', async () => {
        await expect(resolveTokens('[Studied Strike:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('empty') });
    });
    it('[Studied Strike:DMG] resolves despite null ATK', async () => {
        const { resolved, damageType } = await resolveTokens('[Studied Strike:DMG]', fx.url, null);
        expect(resolved).toBe('2d6 + 0');
        expect(damageType).toBe('P');
    });
});

// ============================================================================
// Sheet 5 — Kineticist/TWF with six offense rows
// ============================================================================

describe('Sheet5 — real data', () => {
    const fx = SHEET_FIXTURES[4];

    beforeEach(() => useMocks(fx));

    it('[INT] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[INT]', fx.url, null);
        expect(resolved).toBe('6');
    });
    it('[WIS] resolves to 0', async () => {
        const { resolved } = await resolveTokens('[WIS]', fx.url, null);
        expect(resolved).toBe('0');
    });

    it('[fort] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('5');
    });
    it('[will] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('6');
    });

    it('[BAB] resolves to 4', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('4');
    });
    it('[CMB] resolves to 4', async () => {
        const { resolved } = await resolveTokens('[CMB]', fx.url, null);
        expect(resolved).toBe('4');
    });

    // Offense — all four bolt entries + dagger
    it('[Mystic Bolt (TWF Melee):ATK] exact match, single attack +9', async () => {
        const { resolved } = await resolveTokens('[Mystic Bolt (TWF Melee):ATK]', fx.url, null);
        expect(resolved).toBe('9');
    });
    it('[Mystic Bolt (TWF Ranged):ATK] resolves first iterative +8', async () => {
        const { resolved } = await resolveTokens('[Mystic Bolt (TWF Ranged):ATK]', fx.url, null);
        expect(resolved).toBe('8');
    });
    it('[Mystic Bolt (TWF Ranged):ATK:2] resolves second iterative +8', async () => {
        const { resolved } = await resolveTokens('[Mystic Bolt (TWF Ranged):ATK:2]', fx.url, null);
        expect(resolved).toBe('8');
    });

    // Dagger (Melee) exact match
    it('[Dagger (Melee):DMG] exact match, resolves to 1d3 + 3', async () => {
        const { resolved, damageType } = await resolveTokens('[Dagger (Melee):DMG]', fx.url, null);
        expect(resolved).toBe('1d3 + 3');
        expect(damageType).toBeNull(); // AB30 = null
    });

    // "Dagger" without qualifier is ambiguous (matches Melee & Ranged)
    it('[Dagger:ATK] throws ambiguous when both Dagger rows match', async () => {
        await expect(resolveTokens('[Dagger:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Ambiguous') });
    });
});

// ============================================================================
// Sheet 6 — Monk/Kineticist, three-hit flurry + energy blasts
// ============================================================================

describe('Sheet6 — real data', () => {
    const fx = SHEET_FIXTURES[5];

    beforeEach(() => useMocks(fx));

    it('[STR] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[STR]', fx.url, null);
        expect(resolved).toBe('6');
    });
    it('[WIS] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[WIS]', fx.url, null);
        expect(resolved).toBe('5');
    });
    it('[CHA] resolves to -2', async () => {
        const { resolved } = await resolveTokens('[CHA]', fx.url, null);
        expect(resolved).toBe('-2');
    });

    it('[fort] resolves to 11', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('11');
    });
    it('[ref] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('10');
    });
    it('[will] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[will]', fx.url, null);
        expect(resolved).toBe('10');
    });

    it('[init] resolves to 8', async () => {
        const { resolved } = await resolveTokens('[init]', fx.url, null);
        expect(resolved).toBe('8');
    });
    it('[perc] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('10');
    });

    // Offense — Unarmed Strike (row 1)
    it('[Unarmed:ATK] prefix-matches the long unarmed strike row', async () => {
        const { resolved } = await resolveTokens('[Unarmed:ATK]', fx.url, null);
        expect(resolved).toBe('10');
    });
    it('[Unarmed:DMG] type is B', async () => {
        const { resolved, damageType } = await resolveTokens('[Unarmed:DMG]', fx.url, null);
        expect(resolved).toBe('1d8 + 13');
        expect(damageType).toBe('B');
    });

    // Offense — Flurry with THREE iterative attacks (+11/+11/+6)
    it('[Flurry:ATK] prefix-matches flurry row, first hit +11', async () => {
        const { resolved } = await resolveTokens('[Flurry:ATK]', fx.url, null);
        expect(resolved).toBe('11');
    });
    it('[Flurry:ATK:2] resolves second flurry hit +11', async () => {
        const { resolved } = await resolveTokens('[Flurry:ATK:2]', fx.url, null);
        expect(resolved).toBe('11');
    });
    it('[Flurry:ATK:3] resolves third flurry hit +6', async () => {
        const { resolved } = await resolveTokens('[Flurry:ATK:3]', fx.url, null);
        expect(resolved).toBe('6');
    });
    it('[Flurry:ATK:4] throws — only 3 attacks', async () => {
        await expect(resolveTokens('[Flurry:ATK:4]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Only 3 iterative attack') });
    });

    // Offense — Fire Blast (no attack cell, O28 = null)
    it('[Fire Blast:ATK] throws because O28 is null', async () => {
        await expect(resolveTokens('[Fire Blast:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('empty') });
    });
    it('[Fire Blast:DMG] resolves damage and damageType "Fire"', async () => {
        const { resolved, damageType } = await resolveTokens('[Fire Blast:DMG]', fx.url, null);
        expect(resolved).toBe('1d6 + 0');
        expect(damageType).toBe('Fire');
    });

    // Compound notation: multiple tokens in a single string
    it('resolves multiple tokens in one expression', async () => {
        const { resolved } = await resolveTokens('[STR] + [WIS]', fx.url, null);
        expect(resolved).toBe('6 + 5');
    });
    it('resolves stat + save in one expression', async () => {
        const { resolved } = await resolveTokens('1d20 + [fort] + [STR]', fx.url, null);
        expect(resolved).toBe('1d20 + 11 + 6');
    });
});

// ============================================================================
// Cross-sheet: direct A1 cell-ref tokens bypass alias lookup
// ============================================================================

describe('Direct cell-ref token (all sheets)', () => {
    it('Sheet1 — [G9] fetches raw STR cell without named-range lookup', async () => {
        const fx = SHEET_FIXTURES[0];
        useMocks(fx);
        const { resolved } = await resolveTokens('1d20 + [G9]', fx.url, null);
        expect(resolved).toBe('1d20 + 6');
        // resolveNamedRanges should NOT have been called for a direct cell ref
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });

    it('Sheet2 — [G10] fetches raw DEX cell (+5)', async () => {
        const fx = SHEET_FIXTURES[1];
        useMocks(fx);
        const { resolved } = await resolveTokens('[G10]', fx.url, null);
        expect(resolved).toBe('5');
        expect(mockResolveNamedRanges).not.toHaveBeenCalled();
    });

    it('Sheet3 — [F19] is will save (-3), retrieved as direct cell ref', async () => {
        const fx = SHEET_FIXTURES[2];
        useMocks(fx);
        const { resolved } = await resolveTokens('[F19]', fx.url, null);
        expect(resolved).toBe('-3');
    });
});
