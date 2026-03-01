/**
 * @file pathfinderRoll.ts
 * @description Pre-processor that resolves stat/skill references in dice-notation
 * strings against a live Google Sheets character sheet.
 *
 * Stat and skill references may be written in either the bracketed form
 * (`[STR]`, `[perc]`) **or** as bare words without brackets (`STR`, `perc`).
 * Bare forms are normalised to bracket form before the main pipeline runs.
 * Offense references (`Name:ATK`, `Name:DMG`) always require brackets.
 *
 * Exported surface:
 * - `hasTokens(notation)` — quick check for `[…]` tokens or bare stat aliases.
 * - `resolveAllAttacks(notation, sheetUrl, sheetConfig)` — preferred entry point.
 *   When the notation contains an ATK token with no explicit index (`[Name:ATK]`),
 *   splits the raw attack cell on `/` and returns one `ResolveTokensResult` per
 *   iterative bonus, batching all cell reads into a single HTTP call.  Falls back
 *   to a single-element result array when no all-iterative ATK token is present.
 * - `resolveTokens(notation, sheetUrl, sheetConfig)` — resolves a single notation
 *   string; `[Name:ATK]` without an index selects only the first (highest) bonus.
 *
 * Resolution order per `[token]`:
 *   1. A1 cell-reference pattern (letters followed by digits).
 *   2. Stat/skill alias table.
 *   3. Offense reference (`Name:ATK`, `Name:ATK:n`, `Name:DMG`).
 *
 * All cell reads are batched into a single `batchGet` call per roll invocation.
 */
import type { PathfinderSheetConfig } from '@prisma/client';
import { UserError } from '@sapphire/framework';
import { batchGetValues, extractSheetId, resolveNamedRanges } from './sheets';
import type { RangeValueMap } from './sheets';
import defaultSheetConfig from '../../config/default/PathfinderSheetConfig.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The raw schema stored in PathfinderSheetConfig.schema / the JSON default. */
interface SheetSchema {
    name: string;
    sheetName?: string;
    skills: Record<string, string>;
    abilities: Record<string, string>;
    saves: Record<string, string>;
    defenses: Record<string, string>;
    cmb: string;
    initiative: string;
    offenses: OffenseSchema[];
    totals: {
        bab: string;
        level: string;
    };
    health: string;
}

interface OffenseSchema {
    name: string;
    attack: string;
    damage: string;
    crit: string;
    multiplier: string;
    range: string;
    type: string;
}

interface ResolvedConfig {
    schema: SheetSchema;
    sheetName: string;
}

// ---------------------------------------------------------------------------
// Token grammar
// ---------------------------------------------------------------------------

const TOKEN_RE = /\[([^\]]+)\]/g;
const CELL_REF_RE = /^[A-Za-z]+[0-9]+$/;
const OFFENSE_RE = /^(.+?):(ATK|ATTACK|DMG|DAMAGE)(?::(\d+))?$/i;

// ---------------------------------------------------------------------------
// Alias tables
// ---------------------------------------------------------------------------

/** Stat aliases → canonical key used to look up in the schema. */
const STAT_ALIASES: Record<string, { type: 'ability' | 'save' | 'cell'; key: string }> = {
    // Abilities (named ranges)
    str:          { type: 'ability', key: 'strength' },
    strength:     { type: 'ability', key: 'strength' },
    dex:          { type: 'ability', key: 'dexterity' },
    dexterity:    { type: 'ability', key: 'dexterity' },
    con:          { type: 'ability', key: 'constitution' },
    constitution: { type: 'ability', key: 'constitution' },
    int:          { type: 'ability', key: 'intelligence' },
    intelligence: { type: 'ability', key: 'intelligence' },
    wis:          { type: 'ability', key: 'wisdom' },
    wisdom:       { type: 'ability', key: 'wisdom' },
    cha:          { type: 'ability', key: 'charisma' },
    charisma:     { type: 'ability', key: 'charisma' },
    // Saves
    fort:         { type: 'save', key: 'fortitude' },
    fortitude:    { type: 'save', key: 'fortitude' },
    ref:          { type: 'save', key: 'reflex' },
    reflex:       { type: 'save', key: 'reflex' },
    will:         { type: 'save', key: 'will' },
    // Combat
    cmb:          { type: 'cell', key: 'cmb' },
    bab:          { type: 'cell', key: 'bab' },
    baseattack:   { type: 'cell', key: 'bab' },
    init:         { type: 'cell', key: 'initiative' },
    initiative:   { type: 'cell', key: 'initiative' },
};

/** Skill aliases → canonical skill name matching the schema `skills` map keys. */
const SKILL_ALIASES: Record<string, string> = {
    acrobatics: 'Acrobatics', acro: 'Acrobatics',
    appraise: 'Appraise', appr: 'Appraise',
    bluff: 'Bluff',
    climb: 'Climb',
    diplomacy: 'Diplomacy', diplo: 'Diplomacy',
    'disable device': 'Disable Device', dd: 'Disable Device', disable: 'Disable Device',
    disguise: 'Disguise', disg: 'Disguise',
    'escape artist': 'Escape Artist', ea: 'Escape Artist', escape: 'Escape Artist',
    fly: 'Fly',
    'handle animal': 'Handle Animal', ha: 'Handle Animal', handle: 'Handle Animal',
    heal: 'Heal',
    intimidate: 'Intimidate', intim: 'Intimidate',
    'kn. spheric': 'Kn. Spheric', ksph: 'Kn. Spheric', spheric: 'Kn. Spheric', 'kn.spheric': 'Kn. Spheric',
    'kn. dungeoneering': 'Kn. Dungeoneering', kdung: 'Kn. Dungeoneering', dungeon: 'Kn. Dungeoneering', 'kn.dungeon': 'Kn. Dungeoneering',
    'kn. engineering': 'Kn. Engineering', keng: 'Kn. Engineering', engineer: 'Kn. Engineering', 'kn.engineering': 'Kn. Engineering',
    'kn. geography': 'Kn. Geography', kgeo: 'Kn. Geography', geography: 'Kn. Geography', 'kn.geography': 'Kn. Geography',
    'kn. history': 'Kn. History', khist: 'Kn. History', history: 'Kn. History', 'kn.history': 'Kn. History',
    'kn. local': 'Kn. Local', kloc: 'Kn. Local', local: 'Kn. Local', 'kn.local': 'Kn. Local',
    'kn. nature': 'Kn. Nature', knat: 'Kn. Nature', nature: 'Kn. Nature', 'kn.nature': 'Kn. Nature',
    'kn. nobility': 'Kn. Nobility', knob: 'Kn. Nobility', nobility: 'Kn. Nobility', 'kn.nobility': 'Kn. Nobility',
    'kn. religion': 'Kn. Religion', krel: 'Kn. Religion', religion: 'Kn. Religion', 'kn.religion': 'Kn. Religion',
    linguistics: 'Linguistics', ling: 'Linguistics',
    perception: 'Perception', perc: 'Perception',
    piloting: 'Piloting', pilot: 'Piloting',
    ride: 'Ride',
    'sense motive': 'Sense Motive', sm: 'Sense Motive', sense: 'Sense Motive',
    'sleight of hand': 'Sleight of Hand', soh: 'Sleight of Hand', sleight: 'Sleight of Hand',
    'spheric combat': 'Spheric Combat', sc: 'Spheric Combat', sphcombat: 'Spheric Combat',
    stealth: 'Stealth',
    survival: 'Survival', surv: 'Survival',
    swim: 'Swim',
};

// ---------------------------------------------------------------------------
// Bare alias support (stat / skill refs without brackets)
// ---------------------------------------------------------------------------

/** Escapes a literal string for safe embedding in a RegExp. */
function escapeForRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * All stat and skill alias keys sorted longest-first so that longer aliases
 * take precedence over shorter overlapping ones during replacement.
 * Offense references are intentionally excluded — they still require `[...]`.
 */
const BARE_ALIAS_KEYS = [
    ...Object.keys(STAT_ALIASES),
    ...Object.keys(SKILL_ALIASES),
].sort((a, b) => b.length - a.length);

/**
 * Matches a bare (un-bracketed) stat or skill alias as a whole word/token.
 * Global + case-insensitive — used for `String.replace()` during normalisation.
 */
const BARE_ALIAS_REPLACE_RE = new RegExp(
    `\\b(?:${BARE_ALIAS_KEYS.map(escapeForRegex).join('|')})\\b`,
    'gi',
);

/**
 * Non-global variant used only in `hasTokens()`.  A global regex accumulates
 * `lastIndex` state, which causes false negatives when `.test()` is called on
 * the same instance more than once.
 */
const BARE_ALIAS_TEST_RE = new RegExp(BARE_ALIAS_REPLACE_RE.source, 'i');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the notation string contains any `[…]` tokens **or** any
 * bare stat / skill aliases (e.g. `STR`, `perc`, `fort`).
 * Bare offense references are not detected here because they always require brackets.
 */
export function hasTokens(notation: string): boolean {
    return /\[[^\]]+\]/.test(notation) || BARE_ALIAS_TEST_RE.test(notation);
}

export interface ResolveTokensResult {
    /** Notation with all tokens substituted with numeric values. */
    resolved: string;
    /**
     * Damage type string if the notation contained a `[Name:DMG]` token, null
     * otherwise. Only the last DMG token's type is surfaced (single DMG roll).
     */
    damageType: string | null;
}

/**
 * Wraps any bare (un-bracketed) stat or skill alias in `[…]` so the main
 * token pipeline handles it uniformly.  Existing `[…]` tokens are preserved
 * unchanged.  Offense references are never matched here.
 *
 * Example: `"1d20 + STR + fort"` → `"1d20 + [STR] + [fort]"`
 */
function normalizeBareAliases(notation: string): string {
    // Split on existing bracket tokens; the capturing group in the regex means
    // those tokens appear as elements in the result array — skip them.
    const parts = notation.split(/(\[[^\]]+\])/);
    return parts
        .map((part) => (part.startsWith('[') ? part : part.replace(BARE_ALIAS_REPLACE_RE, (m) => `[${m}]`)))
        .join('');
}

/**
 * Pre-processes `notation`, replacing every `[…]` token (and any bare
 * stat / skill aliases) with its numeric value read from the character's
 * live Google Sheet.
 *
 * @param notation       Raw notation string (may contain `[…]` tokens or bare aliases).
 * @param sheetUrl       Full Google Sheets URL of the character sheet.
 * @param sheetConfig    Guild-specific (or default) PathfinderSheetConfig row.
 */
/**
 * Like `resolveTokens` but when the notation contains an ATK token without an
 * explicit attack index (`[Name:ATK]` rather than `[Name:ATK:1]`), expands into
 * one resolved notation string per iterative attack, splitting the raw cell value
 * on `/`.  All cells are batch-fetched once.  Returns a single-element array
 * when no all-iterative ATK token is present.
 */
export async function resolveAllAttacks(
    notation: string,
    sheetUrl: string,
    sheetConfig: PathfinderSheetConfig | null,
): Promise<ResolveTokensResult[]> {
    const normalizedNotation = normalizeBareAliases(notation);
    const config = resolveConfig(sheetConfig);
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
        throw new UserError({ identifier: 'The character sheet URL is invalid. Please re-register the character.' });
    }

    const tokens = [...normalizedNotation.matchAll(TOKEN_RE)].map((m) => m[1]);
    if (tokens.length === 0) return [{ resolved: normalizedNotation, damageType: null }];

    const tokenMeta: TokenMeta[] = tokens.map((t) => classifyToken(t, config.schema));

    // Only expand when exactly one all-iterative ATK token is present.
    const iterativeToken = tokenMeta.find(
        (m): m is OffenseTokenMeta => m.kind === 'offense' && m.subType === 'ATK' && m.allIterative,
    );
    if (!iterativeToken) {
        return [await resolveTokens(notation, sheetUrl, sheetConfig)];
    }

    // -------------------------------------------------------------------------
    // Collect all cells needed for the single batch-fetch.
    // -------------------------------------------------------------------------
    const namedRangeNames = new Set<string>();
    const directCells = new Set<string>();

    for (const meta of tokenMeta) {
        if (meta.kind === 'cell') {
            if (meta.isNamedRange) namedRangeNames.add(meta.rangeOrCell);
            else directCells.add(meta.rangeOrCell);
        }
    }
    // Always pre-fetch offense name, attack, damage, and type cells.
    for (const o of config.schema.offenses) {
        directCells.add(o.name);
        directCells.add(o.attack);
        directCells.add(o.damage);
        directCells.add(o.type);
    }

    const namedRangeMap: Record<string, string> = {};
    if (namedRangeNames.size > 0) {
        const allNamed = await resolveNamedRanges(spreadsheetId);
        for (const name of namedRangeNames) {
            const cell = allNamed[name];
            if (cell) { namedRangeMap[name] = cell; directCells.add(cell); }
            else throw new UserError({ identifier: `Named range \`${name}\` was not found in the spreadsheet.` });
        }
    }

    const cellArray = [...directCells];
    const values: RangeValueMap = cellArray.length > 0
        ? await batchGetValues(spreadsheetId, config.sheetName, cellArray)
        : {};

    const offenseNameValues = config.schema.offenses.map((o) => values[o.name] ?? null);

    // -------------------------------------------------------------------------
    // Locate the offense row matching the iterative token.
    // -------------------------------------------------------------------------
    const q = iterativeToken.nameQuery.toLowerCase();
    const candidates = offenseNameValues
        .map((name, idx) => ({ name, idx }))
        .filter((e) => e.name !== null && e.name.trim() !== '');

    const exact     = candidates.filter((e) => e.name!.toLowerCase() === q);
    const prefix    = candidates.filter((e) => e.name!.toLowerCase().startsWith(q));
    const substring = candidates.filter((e) => e.name!.toLowerCase().includes(q));

    let match: { name: string | null; idx: number } | undefined;
    if (exact.length === 1)           match = exact[0];
    else if (prefix.length === 1)     match = prefix[0];
    else if (substring.length === 1)  match = substring[0];
    else if (exact.length > 1 || prefix.length > 1 || substring.length > 1) {
        const pool = (exact.length > 1 ? exact : prefix.length > 1 ? prefix : substring)
            .map((e) => `\`${e.name}\``).join(', ');
        throw new UserError({ identifier: `Ambiguous offense name \`${iterativeToken.nameQuery}\` — did you mean: ${pool}?` });
    } else {
        throw new UserError({ identifier: `No offense named \`${iterativeToken.nameQuery}\` was found on the sheet.` });
    }

    const offense = config.schema.offenses[match.idx];
    const rawAtk  = values[offense.attack];
    if (!rawAtk) throw new UserError({ identifier: `Attack cell \`${offense.attack}\` for \`${match.name}\` is empty.` });

    const atkParts = rawAtk.split('/').map((s) => s.trim());

    // -------------------------------------------------------------------------
    // For each attack part, substitute the iterative token then resolve others.
    // -------------------------------------------------------------------------
    const results: ResolveTokensResult[] = [];

    for (let i = 0; i < atkParts.length; i++) {
        const bonus    = parseNumericValue(atkParts[i], `${iterativeToken.nameQuery}:ATK`);
        const bonusStr = formatNumber(bonus);

        // Replace only the all-iterative ATK placeholder; keep brackets for other tokens.
        let partNotation = normalizedNotation.replace(`[${iterativeToken.raw}]`, bonusStr);

        // Resolve remaining tokens using the already-fetched values.
        let damageType: string | null = null;

        for (let j = tokens.length - 1; j >= 0; j--) {
            const raw  = tokens[j];
            const meta = tokenMeta[j];

            // Already substituted.
            if (meta.kind === 'offense' && (meta as OffenseTokenMeta).allIterative) continue;

            if (meta.kind === 'cell') {
                const cell       = meta.isNamedRange ? namedRangeMap[meta.rangeOrCell] : meta.rangeOrCell;
                const rawVal     = values[cell];
                const num        = parseNumericValue(rawVal, raw);
                const sub        = formatNumber(num);
                partNotation = partNotation.replace(`[${raw}]`, sub);
            } else {
                const { substitution: sub, type } = resolveOffense(
                    meta as OffenseTokenMeta, offenseNameValues, config.schema, values,
                );
                partNotation = partNotation.replace(`[${raw}]`, sub);
                if (type !== null) damageType = type;
            }
        }

        results.push({ resolved: partNotation, damageType });
    }

    return results;
}

export async function resolveTokens(
    notation: string,
    sheetUrl: string,
    sheetConfig: PathfinderSheetConfig | null,
): Promise<ResolveTokensResult> {
    // Wrap any bare stat/skill aliases in brackets before the token pipeline runs.
    const normalizedNotation = normalizeBareAliases(notation);
    const config = resolveConfig(sheetConfig);
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
        throw new UserError({
            identifier: 'The character sheet URL is invalid. Please re-register the character.',
        });
    }

    // -------------------------------------------------------------------------
    // Pass 1: collect all tokens and determine which ranges to fetch.
    // -------------------------------------------------------------------------
    const tokens = [...normalizedNotation.matchAll(TOKEN_RE)].map((m) => m[1]);
    if (tokens.length === 0) return { resolved: normalizedNotation, damageType: null };

    // Named-range names that need lookup via spreadsheets.get
    const namedRangeNames = new Set<string>();
    // Direct A1 cell refs (including schema cell refs)
    const directCells = new Set<string>();
    // Track which offense data columns are needed for the single batch call.
    let needsOffenseNames = false;
    let needsOffenseATK = false;
    let needsOffenseDMG = false;

    const tokenMeta: TokenMeta[] = [];

    for (const raw of tokens) {
        const meta = classifyToken(raw, config.schema);
        tokenMeta.push(meta);

        if (meta.kind === 'cell') {
            if (meta.isNamedRange) {
                namedRangeNames.add(meta.rangeOrCell);
            } else {
                directCells.add(meta.rangeOrCell);
            }
        } else if (meta.kind === 'offense') {
            needsOffenseNames = true;
            if (meta.subType === 'ATK') needsOffenseATK = true;
            else needsOffenseDMG = true;
        }
    }

    // -------------------------------------------------------------------------
    // Pass 2: resolve named ranges to cell addresses.
    // -------------------------------------------------------------------------
    const namedRangeMap: Record<string, string> = {};
    if (namedRangeNames.size > 0) {
        const allNamedRanges = await resolveNamedRanges(spreadsheetId);
        for (const name of namedRangeNames) {
            const cell = allNamedRanges[name];
            if (cell) {
                namedRangeMap[name] = cell;
                directCells.add(cell);
            } else {
                throw new UserError({ identifier: `Named range \`${name}\` was not found in the spreadsheet.` });
            }
        }
    }

    // -------------------------------------------------------------------------
    // Pre-add all offense cells required by token types so everything lands in
    // the single batchGet call. Name cells are always needed; attack/damage/type
    // cells are added based on which token subtypes are present.
    // -------------------------------------------------------------------------
    let offenseNameValues: (string | null)[] = [];
    if (needsOffenseNames) {
        for (const o of config.schema.offenses) {
            directCells.add(o.name);
            if (needsOffenseATK) directCells.add(o.attack);
            if (needsOffenseDMG) {
                directCells.add(o.damage);
                directCells.add(o.type);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Pass 3: batch-fetch all required cells.
    // -------------------------------------------------------------------------
    const cellArray = [...directCells];
    const values: RangeValueMap = cellArray.length > 0
        ? await batchGetValues(spreadsheetId, config.sheetName, cellArray)
        : {};

    if (needsOffenseNames) {
        offenseNameValues = config.schema.offenses.map((o) => values[o.name] ?? null);
    }

    // -------------------------------------------------------------------------
    // Pass 4: substitute each token with its resolved value.
    // -------------------------------------------------------------------------
    let resolved = normalizedNotation;
    let damageType: string | null = null;

    for (let i = tokens.length - 1; i >= 0; i--) {
        const raw = tokens[i];
        const meta = tokenMeta[i];
        let substitution: string;

        if (meta.kind === 'cell') {
            const cell = meta.isNamedRange ? namedRangeMap[meta.rangeOrCell] : meta.rangeOrCell;
            const rawVal = values[cell];
            const num = parseNumericValue(rawVal, raw);
            substitution = formatNumber(num);
        } else {
            // offense token
            const { substitution: sub, type } = resolveOffense(
                meta, offenseNameValues, config.schema, values
            );
            substitution = sub;
            if (type !== null) damageType = type;
        }

        // Replace the token at its position in the string.
        // Replace left-to-right by iterating in reverse so indices stay valid.
        resolved = resolved.replace(`[${raw}]`, substitution);
    }

    return { resolved, damageType };
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

function resolveConfig(sheetConfig: PathfinderSheetConfig | null): ResolvedConfig {
    if (sheetConfig) {
        const schema = sheetConfig.schema as unknown as SheetSchema;
        return { schema, sheetName: sheetConfig.sheetName };
    }
    const def = defaultSheetConfig as { version: string; sheetName: string; schema: SheetSchema };
    return { schema: def.schema, sheetName: def.sheetName };
}

// ---------------------------------------------------------------------------
// Token classification
// ---------------------------------------------------------------------------

interface CellTokenMeta {
    kind: 'cell';
    raw: string;
    rangeOrCell: string;
    isNamedRange: boolean;
}

interface OffenseTokenMeta {
    kind: 'offense';
    raw: string;
    nameQuery: string;
    subType: 'ATK' | 'DMG';
    attackIndex: number; // 1-based; 1 = first/highest
    /** True when the user wrote `[Name:ATK]` with no explicit index — signals full-attack expansion. */
    allIterative: boolean;
}

type TokenMeta = CellTokenMeta | OffenseTokenMeta;

function classifyToken(raw: string, schema: SheetSchema): TokenMeta {
    const lower = raw.toLowerCase();

    // 1. Cell reference (A1 pattern)
    if (CELL_REF_RE.test(raw)) {
        return { kind: 'cell', raw, rangeOrCell: raw.toUpperCase(), isNamedRange: false };
    }

    // 2. Stat alias table
    const statAlias = STAT_ALIASES[lower];
    if (statAlias) {
        return statAliasToMeta(raw, statAlias, schema);
    }

    // Skill alias
    const skillName = SKILL_ALIASES[lower];
    if (skillName) {
        const cell = schema.skills[skillName];
        if (!cell) throw new UserError({ identifier: `Skill \`${skillName}\` is not in the sheet config.` });
        return { kind: 'cell', raw, rangeOrCell: cell, isNamedRange: false };
    }

    // 3. Offense reference
    const offenseMatch = OFFENSE_RE.exec(raw);
    if (offenseMatch) {
        const nameQuery = offenseMatch[1];
        const subTypeRaw = offenseMatch[2].toUpperCase();
        const subType: 'ATK' | 'DMG' = (subTypeRaw === 'ATK' || subTypeRaw === 'ATTACK') ? 'ATK' : 'DMG';
        const attackIndex = offenseMatch[3] ? parseInt(offenseMatch[3], 10) : 1;
        const allIterative = !offenseMatch[3] && subType === 'ATK';
        return { kind: 'offense', raw, nameQuery, subType, attackIndex, allIterative };
    }

    throw new UserError({ identifier: `Unknown token \`[${raw}]\`. Check the roll notation and try again.` });
}

function statAliasToMeta(raw: string, alias: { type: 'ability' | 'save' | 'cell'; key: string }, schema: SheetSchema): CellTokenMeta {
    if (alias.type === 'ability') {
        const namedRange = schema.abilities[alias.key];
        if (!namedRange) throw new UserError({ identifier: `Ability \`${alias.key}\` is not in the sheet config.` });
        return { kind: 'cell', raw, rangeOrCell: namedRange, isNamedRange: true };
    }
    if (alias.type === 'save') {
        const cell = schema.saves[alias.key];
        if (!cell) throw new UserError({ identifier: `Save \`${alias.key}\` is not in the sheet config.` });
        return { kind: 'cell', raw, rangeOrCell: cell, isNamedRange: false };
    }
    // 'cell' type — could be cmb, bab, initiative
    if (alias.key === 'bab') {
        const namedRange = schema.totals.bab;
        return { kind: 'cell', raw, rangeOrCell: namedRange, isNamedRange: true };
    }
    if (alias.key === 'cmb') {
        return { kind: 'cell', raw, rangeOrCell: schema.cmb, isNamedRange: false };
    }
    if (alias.key === 'initiative') {
        return { kind: 'cell', raw, rangeOrCell: schema.initiative, isNamedRange: false };
    }
    throw new UserError({ identifier: `Unrecognised stat key \`${alias.key}\`.` });
}

// ---------------------------------------------------------------------------
// Offense resolution
// ---------------------------------------------------------------------------

function resolveOffense(
    meta: OffenseTokenMeta,
    offenseNameValues: (string | null)[],
    schema: SheetSchema,
    values: RangeValueMap,
): { substitution: string; type: string | null } {
    // Find matching offense row(s).
    const q = meta.nameQuery.toLowerCase();
    const candidates = offenseNameValues
        .map((name, idx) => ({ name, idx }))
        .filter((e) => e.name !== null && e.name.trim() !== '');

    const exact     = candidates.filter((e) => e.name!.toLowerCase() === q);
    const prefix    = candidates.filter((e) => e.name!.toLowerCase().startsWith(q));
    const substring = candidates.filter((e) => e.name!.toLowerCase().includes(q));

    let match: { name: string | null; idx: number } | undefined;
    if (exact.length === 1) {
        match = exact[0];
    } else if (prefix.length === 1) {
        match = prefix[0];
    } else if (substring.length === 1) {
        match = substring[0];
    } else if (exact.length > 1 || prefix.length > 1 || substring.length > 1) {
        const pool = (exact.length > 1 ? exact : prefix.length > 1 ? prefix : substring)
            .map((e) => `\`${e.name}\``).join(', ');
        throw new UserError({
            identifier: `Ambiguous offense name \`${meta.nameQuery}\` — did you mean: ${pool}?`,
        });
    } else {
        throw new UserError({ identifier: `No offense named \`${meta.nameQuery}\` was found on the sheet.` });
    }

    const offense = schema.offenses[match.idx];

    if (meta.subType === 'ATK') {
        const rawAtk = values[offense.attack];
        if (!rawAtk) throw new UserError({ identifier: `Attack cell \`${offense.attack}\` for \`${match.name}\` is empty.` });

        const parts = rawAtk.split('/').map((s) => s.trim());
        if (meta.attackIndex > parts.length) {
            throw new UserError({
                identifier: `Only ${parts.length} iterative attack${parts.length === 1 ? '' : 's'} found for \`${match.name}\`.`,
            });
        }
        const bonus = parseNumericValue(parts[meta.attackIndex - 1], `${meta.nameQuery}:ATK`);
        return { substitution: formatNumber(bonus), type: null };
    } else {
        // DMG
        const rawDmg = values[offense.damage];
        const rawType = values[offense.type] ?? null;

        if (!rawDmg) throw new UserError({ identifier: `Damage cell \`${offense.damage}\` for \`${match.name}\` is empty.` });

        // Try to detect embedded type in the damage cell.
        let dmgExpression = rawDmg.trim();
        let dmgType = rawType?.trim() || null;

        if (!dmgType) {
            // Attempt to strip trailing non-numeric suffix from the dice expression.
            const suffixMatch = dmgExpression.match(/^([0-9d+\-*\/()^! ]+)\s+([a-zA-Z].*)$/);
            if (suffixMatch) {
                dmgExpression = suffixMatch[1].trim();
                dmgType = suffixMatch[2].trim();
            }
        }

        return { substitution: dmgExpression, type: dmgType };
    }
}

// ---------------------------------------------------------------------------
// Numeric parsing
// ---------------------------------------------------------------------------

function parseNumericValue(raw: string | null | undefined, tokenLabel: string): number {
    if (raw == null || raw === '') {
        throw new UserError({ identifier: `Token \`[${tokenLabel}]\` resolved to an empty cell.` });
    }
    const cleaned = raw.replace(/[+ ]/g, '').trim();
    const n = parseInt(cleaned, 10);
    if (Number.isNaN(n)) {
        throw new UserError({ identifier: `Token \`[${tokenLabel}]\` resolved to a non-numeric value: \`${raw}\`.` });
    }
    return n;
}

function formatNumber(n: number): string {
    return n >= 0 ? `${n}` : `${n}`;
}
