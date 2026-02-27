/**
 * @file sheetData.ts
 * @description Snapshot of real cell values fetched from the six registered
 *              character sheets on 2026-02-27 via fetchSheetFixtures.cjs.
 *
 * Each fixture contains:
 *  - url / spreadsheetId  — permanent Google Sheets identifiers
 *  - namedRanges          — resolved by the service account (Strength → "G9", …)
 *  - cells                — key cell addresses: saves, skills, offense rows,
 *                           and the A1 cells that named ranges point to
 *
 * These values are used by:
 *  - tests/unit/PathfinderRollRealData.test.ts  (mocked API, real fixture values)
 *  - tests/integration/PathfinderRollSheets.integration.test.ts (live API)
 */

export interface SheetFixture {
    /** Human-readable label ("Sheet1" … "Sheet6") */
    name: string;
    /** Full edit URL supplied by the user */
    url: string;
    /** Extracted spreadsheet ID */
    spreadsheetId: string;
    /** Tab name queried */
    tab: string;
    /** Map from named-range key → A1 cell returned by the service account */
    namedRanges: Record<string, string>;
    /** Cell address → raw string value (null = the cell was empty) */
    cells: Record<string, string | null>;
}

export const SHEET_FIXTURES: SheetFixture[] = [
    // ── Sheet 1 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet1',
        url:  'https://docs.google.com/spreadsheets/d/1WFUV_5DdZO_HhIhkDsOtbKC0G_J47gOyJt1IBNWKwqw/edit?usp=sharing',
        spreadsheetId: '1WFUV_5DdZO_HhIhkDsOtbKC0G_J47gOyJt1IBNWKwqw',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            // Ability scores (at named-range cells)
            G9: '6', G10: '2', G11: '2', G12: '-2', G13: '0', G14: '6',
            // BAB
            AM6: '8',
            // Saves
            F17: '16', F18: '12', F19: '15',
            // Combat
            B34: '14', O38: '2',
            // Skills
            AJ9: '3',   AJ10: '-2', AJ11: '15', AJ12: '6',  AJ13: '15',
            AJ14: '1',  AJ15: '9',  AJ16: '-2', AJ17: '-2', AJ18: '13',
            AJ19: '0',  AJ20: '10', AJ21: '-1', AJ22: null, AJ23: '5',
            AJ24: null, AJ25: null, AJ26: null, AJ27: null, AJ28: null,
            AJ29: null, AJ30: null, AJ31: '0',  AJ32: '12', AJ33: '-2',
            AJ34: '0',  AJ35: '-1', AJ36: null, AJ37: '-2', AJ38: '0',  AJ39: '2',
            // Offense rows 26-31
            E26: ' +1 Flaming Greataxe', O26: '+16 / +8',  V26: '1d12+1d6 + 11', AB26: 'S',
            E27: 'MWK Gundrill of Speed', O27: '+16 / +11', V27: '2d6 / 3d6 + 10', AB27: null,
            E28: 'Kukri',                O28: '+15 / +10', V28: '1d4 + 7',         AB28: 'S',
            E29: 'Punch',                O29: '+15 / +10', V29: '1d3 + 7',         AB29: 'B',
            E30: ' +1 Greatsword',       O30: '+16 / +11', V30: '2d6 + 11',        AB30: 'S',
            E31: 'Chainsaw',             O31: '+16 / +11', V31: '3d6 + 10',        AB31: null,
        },
    },
    // ── Sheet 2 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet2',
        url:  'https://docs.google.com/spreadsheets/d/1-KFwfunE3Ml3ER4vRjXFm3bspfLjmKQbS2XrXOcOhmw/edit?usp=sharing',
        spreadsheetId: '1-KFwfunE3Ml3ER4vRjXFm3bspfLjmKQbS2XrXOcOhmw',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            G9: '-1', G10: '5', G11: '1', G12: '7', G13: '4', G14: '-1',
            AM6: '5',
            F17: '9', F18: '10', F19: '15',
            B34: null, O38: '9',
            AJ9: '12',  AJ10: '14', AJ11: '7',  AJ12: '0',  AJ13: '12',
            AJ14: null, AJ15: '-1', AJ16: '5',  AJ17: '5',  AJ18: null,
            AJ19: '15', AJ20: '4',  AJ21: '17', AJ22: '11', AJ23: '14',
            AJ24: '11', AJ25: '11', AJ26: '11', AJ27: '11', AJ28: '11',
            AJ29: '14', AJ30: '14', AJ31: '19', AJ32: '16', AJ33: '5',
            AJ34: '15', AJ35: null, AJ36: '15', AJ37: '6',  AJ38: '4',  AJ39: '0',
            E26: 'Pistol Shooting',   O26: '+12',  V26: '1d8 + 2',   AB26: 'BP',
            E27: 'Quarterstaffing',   O27: '+5',   V27: '1d6 + 0',   AB27: 'BP',
            E28: 'Dagger',            O28: '+11',  V28: '1d4 + 0',   AB28: 'S',
            E29: 'CMB',               O29: '+5',   V29: null,        AB29: null,
            E30: 'Ancient Tech Gun',  O30: '+11',  V30: '2d10 + 1',  AB30: 'BP',
            E31: 'Draconic Claws',    O31: '+11',  V31: '1d4 + 7',   AB31: 'BPS',
        },
    },
    // ── Sheet 3 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet3',
        url:  'https://docs.google.com/spreadsheets/d/1zTO-8OIFoS5DBR2ZPdFAKyKsHaB9EIOvGcyMFO7zmpQ/edit?usp=sharing',
        spreadsheetId: '1zTO-8OIFoS5DBR2ZPdFAKyKsHaB9EIOvGcyMFO7zmpQ',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            G9: '1', G10: '3', G11: '2', G12: '-1', G13: '0', G14: '6',
            AM6: '10',
            F17: '-1', F18: '4', F19: '-3',
            B34: '11', O38: '3',
            AJ9: '3',   AJ10: '-7', AJ11: '6',  AJ12: '-2', AJ13: '6',
            AJ14: null, AJ15: '1',  AJ16: '0',  AJ17: '-4', AJ18: '3',
            AJ19: '-6', AJ20: '6',  AJ21: null, AJ22: null, AJ23: null,
            AJ24: null, AJ25: null, AJ26: '-3', AJ27: null, AJ28: '-3',
            AJ29: null, AJ30: null, AJ31: '-2', AJ32: '-1', AJ33: '0',
            AJ34: '-2', AJ35: '0',  AJ36: null, AJ37: '3',  AJ38: '-6', AJ39: '-2',
            E26: 'Railknife (Melee)',              O26: '+14 / +9',  V26: '1d4 + 14', AB26: 'P',
            E27: 'Railknife (Ranged)',             O27: '+14 / +9',  V27: '1d4 + 14', AB27: 'P',
            E28: 'Precise Strike',                O28: null,         V28: ' + 10',    AB28: 'P',
            E29: 'Precise Strike (Hilt Hammer)',  O29: null,         V29: ' + 5',     AB29: 'B',
            E30: null, O30: null, V30: ' + 0', AB30: null,
            E31: null, O31: null, V31: null,   AB31: null,
        },
    },
    // ── Sheet 4 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet4',
        url:  'https://docs.google.com/spreadsheets/d/1cdtWVQ9-3lS64ZikvdwWguRY5rNNN-1-b-aMomYTMXk/edit#gid=665550463',
        spreadsheetId: '1cdtWVQ9-3lS64ZikvdwWguRY5rNNN-1-b-aMomYTMXk',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            G9: '0', G10: '7', G11: '3', G12: '5', G13: '1', G14: '1',
            AM6: '7',
            F17: '9', F18: '18', F19: '10',
            B34: '7', O38: '7',
            AJ9: '11',  AJ10: '9',  AJ11: '5',  AJ12: '4',  AJ13: '5',
            AJ14: '14', AJ15: '5',  AJ16: '11', AJ17: '7',  AJ18: null,
            AJ19: '5',  AJ20: '1',  AJ21: '16', AJ22: '16', AJ23: '16',
            AJ24: '16', AJ25: '16', AJ26: '16', AJ27: '16', AJ28: '16',
            AJ29: '16', AJ30: '9',  AJ31: '12', AJ32: '11', AJ33: '11',
            AJ34: '9',  AJ35: null, AJ36: null, AJ37: '12', AJ38: '1',  AJ39: '4',
            E26: '(MW) Wrist Launcher, Heavy', O26: '+16 / +11', V26: '1d4 + 1',   AB26: 'P',
            E27: '(+4) Keen Rapier',           O27: '+20 / +15', V27: '1d6 + 12',  AB27: 'P',
            E28: '(MW) Cold Iron Rapier',      O28: '+17 / +12', V28: '1d6 + 8',   AB28: 'P',
            E29: 'Studied Strike',             O29: null,         V29: '2d6 + 0',   AB29: 'P',
            E30: null, O30: '+15 / +10', V30: '1d4 + 8', AB30: null,
            E31: null, O31: null,        V31: null,        AB31: null,
        },
    },
    // ── Sheet 5 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet5',
        url:  'https://docs.google.com/spreadsheets/d/1puD1GyyAHeVBtHI2L7gMtviD5OeW1-Hu2qORwr_f844/edit#gid=665550463',
        spreadsheetId: '1puD1GyyAHeVBtHI2L7gMtviD5OeW1-Hu2qORwr_f844',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            G9: '0', G10: '4', G11: '2', G12: '6', G13: '0', G14: '1',
            AM6: '4',
            F17: '5', F18: '10', F19: '6',
            B34: '4', O38: '6',
            AJ9: '11',  AJ10: '15', AJ11: '10', AJ12: '4',  AJ13: '9',
            AJ14: '5',  AJ15: '10', AJ16: '13', AJ17: '4',  AJ18: null,
            AJ19: '0',  AJ20: '5',  AJ21: '10', AJ22: '10', AJ23: '10',
            AJ24: '7',  AJ25: '7',  AJ26: '11', AJ27: '7',  AJ28: '11',
            AJ29: '8',  AJ30: '7',  AJ31: '10', AJ32: '9',  AJ33: '8',
            AJ34: '9',  AJ35: '13', AJ36: '14', AJ37: '13', AJ38: '0',  AJ39: '4',
            E26: 'Mystic Bolt (TWF Melee)',        O26: '+9',     V26: '1d6 + 4', AB26: null,
            E27: 'Mystic Bolt (TWF Melee) (OH)',   O27: '+9',     V27: '1d6 + 4', AB27: null,
            E28: 'Mystic Bolt (TWF Ranged)',        O28: '+8 / +8', V28: '1d6 + 5', AB28: null,
            E29: 'Mysic Bolt (TWF Ranged) (OH)',   O29: '+8',     V29: '1d6 + 5', AB29: null,
            E30: 'Dagger (Melee)',                 O30: '+4',     V30: '1d3 + 3', AB30: null,
            E31: 'Dagger (Ranged)',                O31: '+7 / +7', V31: '1d3 + 4', AB31: null,
        },
    },
    // ── Sheet 6 ─────────────────────────────────────────────────────────────
    {
        name: 'Sheet6',
        url:  'https://docs.google.com/spreadsheets/d/1uZcBcAcJZixpL_oynncY5RxPT81Ogz5Slbz4UV8VQZg/edit#gid=665550463',
        spreadsheetId: '1uZcBcAcJZixpL_oynncY5RxPT81Ogz5Slbz4UV8VQZg',
        tab: 'Main Sheet',
        namedRanges: {
            Strength: 'G9', Dexterity: 'G10', Constitution: 'G11',
            Intelligence: 'G12', Wisdom: 'G13', Charisma: 'G14',
            BaseAttack: 'AM6', Level: 'AQ6',
        },
        cells: {
            G9: '6', G10: '2', G11: '3', G12: '-2', G13: '5', G14: '-2',
            AM6: '3',
            F17: '11', F18: '10', F19: '10',
            B34: '9', O38: '8',
            AJ9: '10',  AJ10: '-2', AJ11: '-2', AJ12: '10', AJ13: '-5',
            AJ14: null, AJ15: '-2', AJ16: '6',  AJ17: '2',  AJ18: null,
            AJ19: '5',  AJ20: '-2', AJ21: null, AJ22: null, AJ23: null,
            AJ24: null, AJ25: null, AJ26: null, AJ27: null, AJ28: null,
            AJ29: null, AJ30: null, AJ31: '10', AJ32: '0',  AJ33: '2',
            AJ34: '10', AJ35: null, AJ36: null, AJ37: '6',  AJ38: '5',  AJ39: '10',
            E26: 'Unarmed Strike (Also Flurry First Hit for DMG)', O26: '+10',         V26: '1d8 + 13', AB26: 'B',
            E27: 'Flurry (Use DMG from First Row for 1st hit)',    O27: '+11 / +11 / +6', V27: '1d8 + 10', AB27: 'B',
            E28: 'Fire Blast (Energy) [+ Per Hit]',                O28: null,          V28: '1d6 + 0',  AB28: 'Fire',
            E29: 'Air Blast (Physical) [+ Per Hit]',               O29: null,          V29: '0 + 0',    AB29: 'B',
            E30: 'Plasma Blast (Physical) [+ Per Hit]',            O30: null,          V30: '0 + 0',    AB30: 'B+Fi',
            E31: null, O31: null, V31: null, AB31: null,
        },
    },
];
