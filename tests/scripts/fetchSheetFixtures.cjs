/**
 * fetchSheetFixtures.cjs  — CommonJS, run directly with node.
 *
 * Usage:
 *   node tests/scripts/fetchSheetFixtures.cjs > tests/fixtures/sheetData.json
 *
 * Requires GOOGLE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env
 */

require('dotenv/config');
const { google } = require('googleapis');

// ── Auth ──────────────────────────────────────────────────────────────────────

function getAuth() {
    const email = process.env.GOOGLE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const key = rawKey.replace(/\\n/g, '\n');

    if (!email || !key) {
        throw new Error('GOOGLE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY must be set in .env');
    }

    return new google.auth.JWT({
        email,
        key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
}

function extractSheetId(url) {
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
}

// ── Cell helpers ──────────────────────────────────────────────────────────────

function colIndexToLetter(index) {
    let letter = '';
    let n = index + 1;
    while (n > 0) {
        const rem = (n - 1) % 26;
        letter = String.fromCharCode(65 + rem) + letter;
        n = Math.floor((n - 1) / 26);
    }
    return letter;
}

async function resolveNamedRanges(sheets, spreadsheetId) {
    const res = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false });
    const named = {};
    for (const nr of (res.data.namedRanges || [])) {
        const range = nr.range;
        if (!range) continue;
        const col = colIndexToLetter(range.startColumnIndex ?? 0);
        const row = (range.startRowIndex ?? 0) + 1;
        named[nr.name] = `${col}${row}`;
    }
    return named;
}

async function batchGet(sheets, spreadsheetId, sheetName, ranges) {
    const qualified = ranges.map((r) => /^[A-Za-z]+[0-9]+$/.test(r) ? `'${sheetName}'!${r}` : r);
    const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: qualified,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
    });
    const result = {};
    for (let i = 0; i < ranges.length; i++) {
        const vr = (res.data.valueRanges || [])[i];
        const val = vr?.values?.[0]?.[0];
        result[ranges[i]] = val !== undefined && val !== null ? String(val) : null;
    }
    return result;
}

// ── Cells to fetch ────────────────────────────────────────────────────────────

const FIXED_CELLS = [
    'F17', 'F18', 'F19',
    'B34', 'O38',
    'AJ9',  'AJ10', 'AJ11', 'AJ12', 'AJ13', 'AJ14', 'AJ15', 'AJ16', 'AJ17',
    'AJ18', 'AJ19', 'AJ20', 'AJ21', 'AJ22', 'AJ23', 'AJ24', 'AJ25', 'AJ26',
    'AJ27', 'AJ28', 'AJ29', 'AJ30', 'AJ31', 'AJ32', 'AJ33', 'AJ34', 'AJ35',
    'AJ36', 'AJ37', 'AJ38', 'AJ39',
    'E26', 'O26', 'V26', 'AB26',
    'E27', 'O27', 'V27', 'AB27',
    'E28', 'O28', 'V28', 'AB28',
    'E29', 'O29', 'V29', 'AB29',
    'E30', 'O30', 'V30', 'AB30',
    'E31', 'O31', 'V31', 'AB31',
    'C1', 'C2',
];

const NAMED_RANGE_KEYS = [
    'Strength', 'Dexterity', 'Constitution',
    'Intelligence', 'Wisdom', 'Charisma',
    'BaseAttack', 'Level',
];

const SHEET_LIST = [
    { name: 'Sheet1', url: 'https://docs.google.com/spreadsheets/d/1WFUV_5DdZO_HhIhkDsOtbKC0G_J47gOyJt1IBNWKwqw/edit?usp=sharing',                       tab: 'Main Sheet' },
    { name: 'Sheet2', url: 'https://docs.google.com/spreadsheets/d/1-KFwfunE3Ml3ER4vRjXFm3bspfLjmKQbS2XrXOcOhmw/edit?usp=sharing',                       tab: 'Main Sheet' },
    { name: 'Sheet3', url: 'https://docs.google.com/spreadsheets/d/1zTO-8OIFoS5DBR2ZPdFAKyKsHaB9EIOvGcyMFO7zmpQ/edit?usp=sharing',                       tab: 'Main Sheet' },
    { name: 'Sheet4', url: 'https://docs.google.com/spreadsheets/d/1cdtWVQ9-3lS64ZikvdwWguRY5rNNN-1-b-aMomYTMXk/edit#gid=665550463',                     tab: 'Main Sheet' },
    { name: 'Sheet5', url: 'https://docs.google.com/spreadsheets/d/1puD1GyyAHeVBtHI2L7gMtviD5OeW1-Hu2qORwr_f844/edit#gid=665550463',                     tab: 'Main Sheet' },
    { name: 'Sheet6', url: 'https://docs.google.com/spreadsheets/d/1uZcBcAcJZixpL_oynncY5RxPT81Ogz5Slbz4UV8VQZg/edit#gid=665550463',                     tab: 'Main Sheet' },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const auth   = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const results = [];

    for (const entry of SHEET_LIST) {
        const spreadsheetId = extractSheetId(entry.url);
        if (!spreadsheetId) { console.error(`Bad URL: ${entry.url}`); continue; }

        let namedRanges = {};
        try {
            namedRanges = await resolveNamedRanges(sheets, spreadsheetId);
        } catch (e) {
            console.error(`[${entry.name}] resolveNamedRanges failed: ${e.message}`);
        }

        const extraCells = NAMED_RANGE_KEYS.map((k) => namedRanges[k]).filter(Boolean);
        const allCells = [...new Set([...FIXED_CELLS, ...extraCells])];

        let cells = {};
        try {
            cells = await batchGet(sheets, spreadsheetId, entry.tab, allCells);
        } catch (e) {
            console.error(`[${entry.name}] batchGet failed: ${e.message}`);
        }

        results.push({
            name: entry.name,
            url: entry.url,
            spreadsheetId,
            tab: entry.tab,
            namedRanges,
            cells,
        });

        console.error(`[${entry.name}] OK — fetched ${Object.keys(cells).length} cells`);
    }

    process.stdout.write(JSON.stringify(results, null, 2) + '\n');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
