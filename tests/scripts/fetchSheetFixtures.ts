/**
 * @file fetchSheetFixtures.ts
 * @description One-shot helper that reads all spec-defined cells from each of
 *              the six registered character sheets and prints a JSON fixture
 *              object suitable for pasting into the test files.
 *
 * Usage:
 *   npx tsx tests/scripts/fetchSheetFixtures.ts
 *
 * Requires GOOGLE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env (or the
 * calling shell) and that the service account has been granted Viewer access
 * to each sheet (or the sheets are shared "Anyone with the link").
 */

import 'dotenv/config';
import { batchGetValues, extractSheetId, resolveNamedRanges } from '../../src/lib/utils/sheets';

// --------------------------------------------------------------------------
// Sheet registry — the six character sheets under test
// --------------------------------------------------------------------------

const SHEETS: Array<{ name: string; url: string; sheetTab: string }> = [
    {
        name: 'Sheet1',
        url: 'https://docs.google.com/spreadsheets/d/1WFUV_5DdZO_HhIhkDsOtbKC0G_J47gOyJt1IBNWKwqw/edit?usp=sharing',
        sheetTab: 'Main Sheet',
    },
    {
        name: 'Sheet2',
        url: 'https://docs.google.com/spreadsheets/d/1-KFwfunE3Ml3ER4vRjXFm3bspfLjmKQbS2XrXOcOhmw/edit?usp=sharing',
        sheetTab: 'Main Sheet',
    },
    {
        name: 'Sheet3',
        url: 'https://docs.google.com/spreadsheets/d/1zTO-8OIFoS5DBR2ZPdFAKyKsHaB9EIOvGcyMFO7zmpQ/edit?usp=sharing',
        sheetTab: 'Main Sheet',
    },
    {
        name: 'Sheet4',
        url: 'https://docs.google.com/spreadsheets/d/1cdtWVQ9-3lS64ZikvdwWguRY5rNNN-1-b-aMomYTMXk/edit#gid=665550463',
        sheetTab: 'Main Sheet',
    },
    {
        name: 'Sheet5',
        url: 'https://docs.google.com/spreadsheets/d/1puD1GyyAHeVBtHI2L7gMtviD5OeW1-Hu2qORwr_f844/edit#gid=665550463',
        sheetTab: 'Main Sheet',
    },
    {
        name: 'Sheet6',
        url: 'https://docs.google.com/spreadsheets/d/1uZcBcAcJZixpL_oynncY5RxPT81Ogz5Slbz4UV8VQZg/edit#gid=665550463',
        sheetTab: 'Main Sheet',
    },
];

// --------------------------------------------------------------------------
// All discrete cells we want to read (in addition to named-range cells)
// --------------------------------------------------------------------------

/** Cells whose addresses are fixed per the spec sheet layout. */
const FIXED_CELLS = [
    // Saves
    'F17', 'F18', 'F19',
    // Combat
    'B34', // CMB
    'O38', // Initiative
    // Skills AJ9–AJ39
    'AJ9',  'AJ10', 'AJ11', 'AJ12', 'AJ13', 'AJ14', 'AJ15', 'AJ16', 'AJ17',
    'AJ18', 'AJ19', 'AJ20', 'AJ21', 'AJ22', 'AJ23', 'AJ24', 'AJ25', 'AJ26',
    'AJ27', 'AJ28', 'AJ29', 'AJ30', 'AJ31', 'AJ32', 'AJ33', 'AJ34', 'AJ35',
    'AJ36', 'AJ37', 'AJ38', 'AJ39',
    // Offense rows 26-31: name, attack, damage, type
    'E26', 'O26', 'V26', 'AB26',
    'E27', 'O27', 'V27', 'AB27',
    'E28', 'O28', 'V28', 'AB28',
    'E29', 'O29', 'V29', 'AB29',
    'E30', 'O30', 'V30', 'AB30',
    'E31', 'O31', 'V31', 'AB31',
    // Character identity (name / class)
    'C1', 'C2',
];

/** Named ranges used by the spec for ability scores and BAB. */
const NAMED_RANGE_KEYS = [
    'Strength', 'Dexterity', 'Constitution',
    'Intelligence', 'Wisdom', 'Charisma',
    'BaseAttack', 'Level',
];

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function fetchOne(entry: typeof SHEETS[number]) {
    const { name, url, sheetTab } = entry;
    const spreadsheetId = extractSheetId(url);
    if (!spreadsheetId) {
        console.error(`[${name}] Could not extract spreadsheet ID from URL: ${url}`);
        return null;
    }

    // 1. Resolve named ranges → A1 cells
    let namedRanges: Record<string, string> = {};
    try {
        namedRanges = await resolveNamedRanges(spreadsheetId);
    } catch (err) {
        console.error(`[${name}] resolveNamedRanges failed:`, err);
        return null;
    }

    // 2. Build complete cell list: fixed + named-range targets
    const namedRangeCells = NAMED_RANGE_KEYS
        .map((k) => namedRanges[k])
        .filter(Boolean) as string[];

    const allCells = [...new Set([...FIXED_CELLS, ...namedRangeCells])];

    // 3. Fetch all cells in one batch call
    let values: Record<string, string | null> = {};
    try {
        values = await batchGetValues(spreadsheetId, sheetTab, allCells);
    } catch (err) {
        console.error(`[${name}] batchGetValues failed:`, err);
        return null;
    }

    return { name, url, sheetTab, spreadsheetId, namedRanges, values };
}

async function main() {
    console.log('Fetching cell data from all 6 sheets …\n');

    const results = await Promise.all(SHEETS.map(fetchOne));

    const output = results
        .filter(Boolean)
        .map((r) => ({
            name:          r!.name,
            url:           r!.url,
            sheetTab:      r!.sheetTab,
            spreadsheetId: r!.spreadsheetId,
            namedRanges:   r!.namedRanges,
            cells:         r!.values,
        }));

    console.log('// ─── FIXTURE DATA ─────────────────────────────────────────────────');
    console.log('// Paste this into tests/fixtures/sheetData.ts');
    console.log('export const SHEET_FIXTURES = ');
    console.log(JSON.stringify(output, null, 2));
    console.log(';\n');
}

main().catch((err) => {
    console.error('Fatal:', err);
    process.exit(1);
});
