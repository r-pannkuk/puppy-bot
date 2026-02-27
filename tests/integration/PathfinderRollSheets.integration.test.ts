/**
 * @file PathfinderRollSheets.integration.test.ts
 * @description Integration tests for `resolveTokens()` against the six real
 *              Google Sheets character sheets.
 *
 * These tests make **live HTTP requests** to the Google Sheets API and require
 * valid service-account credentials in the environment:
 *
 *   GOOGLE_ACCOUNT_EMAIL=<service account email>
 *   GOOGLE_PRIVATE_KEY=<PEM private key (newlines as \n)>
 *
 * The service account must have been granted read access to all six sheets
 * listed in tests/fixtures/sheetData.ts.
 *
 * All tests are skipped automatically when credentials are absent so that CI
 * pipelines without secrets still pass.
 *
 * Known-good values are derived from the snapshot in tests/fixtures/sheetData.ts.
 */
import { describe, it, expect } from 'vitest';
import { resolveTokens } from '../../src/lib/utils/pathfinderRoll';
import { SHEET_FIXTURES } from '../fixtures/sheetData';

// ---------------------------------------------------------------------------
// Guard — skip everything when Google credentials are missing.
// ---------------------------------------------------------------------------

const hasCredentials =
    !!process.env.GOOGLE_ACCOUNT_EMAIL &&
    !!process.env.GOOGLE_PRIVATE_KEY;

// ============================================================================
// Sheet 1 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet1 (live API)', () => {
    const fx = SHEET_FIXTURES[0];

    it('[STR] resolves to 6', async () => {
        const { resolved } = await resolveTokens('1d20 + [STR]', fx.url, null);
        expect(resolved).toBe('1d20 + 6');
    });

    it('[fort] resolves to 16', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('16');
    });

    it('[perc] resolves to 0', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('0');
    });

    it('[BAB] resolves to 8 (via live named-range lookup)', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('8');
    });

    it('[Kukri:ATK] resolves first attack to 15', async () => {
        const { resolved } = await resolveTokens('[Kukri:ATK]', fx.url, null);
        expect(resolved).toBe('15');
    });

    it('[Kukri:DMG] returns "1d4 + 7" and type "S"', async () => {
        const { resolved, damageType } = await resolveTokens('[Kukri:DMG]', fx.url, null);
        expect(resolved).toBe('1d4 + 7');
        expect(damageType).toBe('S');
    });

    it('compound expression resolves correctly', async () => {
        const { resolved } = await resolveTokens('1d20 + [STR] + [fort]', fx.url, null);
        expect(resolved).toBe('1d20 + 6 + 16');
    });
});

// ============================================================================
// Sheet 2 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet2 (live API)', () => {
    const fx = SHEET_FIXTURES[1];

    it('[DEX] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[DEX]', fx.url, null);
        expect(resolved).toBe('5');
    });

    it('[ref] resolves to 10', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('10');
    });

    it('[perc] resolves to 19', async () => {
        const { resolved } = await resolveTokens('[perc]', fx.url, null);
        expect(resolved).toBe('19');
    });

    it('[CMB] throws because B34 is empty on the live sheet', async () => {
        await expect(resolveTokens('[CMB]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('empty cell') });
    });

    it('[Pistol:ATK] resolves to 12', async () => {
        const { resolved } = await resolveTokens('[Pistol:ATK]', fx.url, null);
        expect(resolved).toBe('12');
    });

    it('[Draconic:DMG] returns type "BPS"', async () => {
        const { damageType } = await resolveTokens('[Draconic:DMG]', fx.url, null);
        expect(damageType).toBe('BPS');
    });
});

// ============================================================================
// Sheet 3 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet3 (live API)', () => {
    const fx = SHEET_FIXTURES[2];

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

    it('[Railknife (Melee):ATK] resolves first attack 14', async () => {
        const { resolved } = await resolveTokens('[Railknife (Melee):ATK]', fx.url, null);
        expect(resolved).toBe('14');
    });

    it('[Railknife:ATK] throws ambiguous on the live sheet', async () => {
        await expect(resolveTokens('[Railknife:ATK]', fx.url, null))
            .rejects.toMatchObject({ identifier: expect.stringContaining('Ambiguous') });
    });
});

// ============================================================================
// Sheet 4 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet4 (live API)', () => {
    const fx = SHEET_FIXTURES[3];

    it('[DEX] resolves to 7', async () => {
        const { resolved } = await resolveTokens('[DEX]', fx.url, null);
        expect(resolved).toBe('7');
    });

    it('[ref] resolves to 18', async () => {
        const { resolved } = await resolveTokens('[ref]', fx.url, null);
        expect(resolved).toBe('18');
    });

    it('[(+4) Keen Rapier:ATK] resolves to 20', async () => {
        const { resolved } = await resolveTokens('[(+4) Keen Rapier:ATK]', fx.url, null);
        expect(resolved).toBe('20');
    });

    it('[(+4) Keen Rapier:DMG] returns "1d6 + 12" and type "P"', async () => {
        const { resolved, damageType } = await resolveTokens('[(+4) Keen Rapier:DMG]', fx.url, null);
        expect(resolved).toBe('1d6 + 12');
        expect(damageType).toBe('P');
    });
});

// ============================================================================
// Sheet 5 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet5 (live API)', () => {
    const fx = SHEET_FIXTURES[4];

    it('[INT] resolves to 6', async () => {
        const { resolved } = await resolveTokens('[INT]', fx.url, null);
        expect(resolved).toBe('6');
    });

    it('[fort] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('5');
    });

    it('[Mystic Bolt (TWF Ranged):ATK] resolves first iterative +8', async () => {
        const { resolved } = await resolveTokens('[Mystic Bolt (TWF Ranged):ATK]', fx.url, null);
        expect(resolved).toBe('8');
    });

    it('[Dagger (Melee):DMG] resolves to 1d3 + 3', async () => {
        const { resolved } = await resolveTokens('[Dagger (Melee):DMG]', fx.url, null);
        expect(resolved).toBe('1d3 + 3');
    });
});

// ============================================================================
// Sheet 6 — live API
// ============================================================================

describe.skipIf(!hasCredentials)('Integration — Sheet6 (live API)', () => {
    const fx = SHEET_FIXTURES[5];

    it('[WIS] resolves to 5', async () => {
        const { resolved } = await resolveTokens('[WIS]', fx.url, null);
        expect(resolved).toBe('5');
    });

    it('[fort] resolves to 11', async () => {
        const { resolved } = await resolveTokens('[fort]', fx.url, null);
        expect(resolved).toBe('11');
    });

    it('[BAB] resolves to 3', async () => {
        const { resolved } = await resolveTokens('[BAB]', fx.url, null);
        expect(resolved).toBe('3');
    });

    it('[Flurry:ATK] resolves first hit +11', async () => {
        const { resolved } = await resolveTokens('[Flurry:ATK]', fx.url, null);
        expect(resolved).toBe('11');
    });

    it('[Flurry:ATK:3] resolves third flurry hit +6', async () => {
        const { resolved } = await resolveTokens('[Flurry:ATK:3]', fx.url, null);
        expect(resolved).toBe('6');
    });

    it('[Fire Blast:DMG] type is "Fire"', async () => {
        const { resolved, damageType } = await resolveTokens('[Fire Blast:DMG]', fx.url, null);
        expect(resolved).toBe('1d6 + 0');
        expect(damageType).toBe('Fire');
    });
});
