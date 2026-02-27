/**
 * @file sheets.ts
 * @description Google Sheets API client helpers for live character-sheet access.
 *
 * Provides:
 * - `getAuthClient()` — creates a JWT auth client from the service-account env vars.
 * - `extractSheetId()` — parses a sheet ID from a Google Sheets URL.
 * - `validateSheetAccess()` — confirms the service account can read the sheet.
 * - `batchGetValues()` — fetches multiple cell ranges in one HTTP round-trip.
 * - `resolveNamedRanges()` — maps a sheet's declared named ranges to A1 notation.
 *
 * No sheet data is ever cached between invocations. Every call reads live values.
 */
import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { env } from '../setup/schema';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cachedAuth: any | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAuthClient(): any {
    if (_cachedAuth) return _cachedAuth;

    const email = env.GOOGLE_ACCOUNT_EMAIL;
    const key = env.GOOGLE_PRIVATE_KEY;

    if (!email || !key) {
        throw new Error(
            'Google Sheets credentials are not configured. ' +
            'Set GOOGLE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your environment.'
        );
    }

    _cachedAuth = new google.auth.JWT({
        email,
        key: key.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    return _cachedAuth;
}

export function getSheetsClient(): sheets_v4.Sheets {
    return google.sheets({ version: 'v4', auth: getAuthClient() });
}

/** Extracts the spreadsheet ID from a Google Sheets URL. Returns null if invalid. */
export function extractSheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface SheetValidationError {
    kind: 'invalid_url' | 'access_denied' | 'tab_not_found';
    message: string;
}

/**
 * Validates that the service account can read the given spreadsheet and that
 * the expected tab (`sheetName`) exists.
 *
 * Returns `null` if valid, or a `SheetValidationError` otherwise.
 */
export async function validateSheetAccess(
    url: string,
    sheetName: string,
    serviceAccountEmail: string,
): Promise<SheetValidationError | null> {
    const spreadsheetId = extractSheetId(url);

    if (!spreadsheetId) {
        return {
            kind: 'invalid_url',
            message: 'That does not look like a valid Google Sheets URL.',
        };
    }

    const sheets = getSheetsClient();

    let spreadsheet: sheets_v4.Schema$Spreadsheet;
    try {
        const res = await sheets.spreadsheets.get({ spreadsheetId, includeGridData: false });
        spreadsheet = res.data;
    } catch (err: unknown) {
        const status = (err as { code?: number })?.code ?? 0;
        if (status === 403 || status === 404) {
            return {
                kind: 'access_denied',
                message:
                    `Could not access this sheet. Please share it with \`${serviceAccountEmail}\` and try again.`,
            };
        }
        throw err;
    }

    const tabExists = spreadsheet.sheets?.some(
        (s) => s.properties?.title === sheetName
    );

    if (!tabExists) {
        return {
            kind: 'tab_not_found',
            message: `The sheet tab \`${sheetName}\` was not found in that spreadsheet.`,
        };
    }

    return null;
}

// ---------------------------------------------------------------------------
// Data retrieval
// ---------------------------------------------------------------------------

export type RangeValueMap = Record<string, string | null>;

/**
 * Fetches multiple ranges from a single spreadsheet in one batched HTTP call.
 *
 * @param spreadsheetId  The spreadsheet ID (not the full URL).
 * @param sheetName      The tab name to scope bare A1 ranges to.
 * @param ranges         Array of A1 ranges or named-range names.
 * @returns              Map of range string → first cell value (or null if empty).
 */
export async function batchGetValues(
    spreadsheetId: string,
    sheetName: string,
    ranges: string[],
): Promise<RangeValueMap> {
    if (ranges.length === 0) return {};

    const sheets = getSheetsClient();

    // Qualify bare A1 ranges with the tab name so they read from the right sheet.
    const qualifiedRanges = ranges.map((r) =>
        r.match(/^[A-Za-z][A-Za-z0-9 ]*$/) && !r.match(/^[A-Za-z]+[0-9]+$/)
            ? r // Likely a named range — send as-is.
            : `'${sheetName}'!${r}`
    );

    const res = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: qualifiedRanges,
    });

    const result: RangeValueMap = {};
    const valueRanges = res.data.valueRanges ?? [];

    for (let i = 0; i < ranges.length; i++) {
        const raw = valueRanges[i]?.values?.[0]?.[0];
        result[ranges[i]] = raw !== undefined ? String(raw) : null;
    }

    return result;
}

// ---------------------------------------------------------------------------
// Named-range resolution
// ---------------------------------------------------------------------------

/**
 * Fetches the spreadsheet metadata and returns a map of named-range name →
 * A1 notation for the start cell of that range.
 *
 * Used to resolve named ranges (e.g., `Strength`, `BaseAttack`) to concrete
 * cell references, which are then included in a batchGet call.
 */
export async function resolveNamedRanges(
    spreadsheetId: string,
): Promise<Record<string, string>> {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
    });

    const namedRanges = res.data.namedRanges ?? [];
    const out: Record<string, string> = {};

    for (const nr of namedRanges) {
        if (!nr.name || !nr.range) continue;
        const r = nr.range;
        if (r.startRowIndex == null || r.startColumnIndex == null) continue;
        const col = columnIndexToLetter(r.startColumnIndex);
        const row = r.startRowIndex + 1;
        out[nr.name] = `${col}${row}`;
    }

    return out;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function columnIndexToLetter(index: number): string {
    let result = '';
    let n = index;
    while (n >= 0) {
        result = String.fromCharCode((n % 26) + 65) + result;
        n = Math.floor(n / 26) - 1;
    }
    return result;
}
