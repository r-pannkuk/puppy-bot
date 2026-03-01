# Pathfinder Character Integration — Feature Specification

> Version: 1.7.0
> Last updated: 2026-03-01

---

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Google Sheets Integration](#google-sheets-integration)
4. [Roll Syntax Extension](#roll-syntax-extension)
5. [Command Structure](#command-structure)
6. [File & Module Layout](#file--module-layout)
7. [Behaviour Invariants](#behaviour-invariants)

---

## Overview

This feature extends the existing `/roll` command with optional live Pathfinder character-sheet references, and introduces a new `/character` command group for managing character registrations per player per guild. The bot's Google Sheets service account credentials (`GOOGLE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) are already declared in the environment schema. The `PathfinderSheetConfig` and `PathfinderCharacterConfig` Prisma models are partially scaffolded. Most infrastructure already exists; this spec defines what is new, what is changed, and how the pieces connect.

---

## Data Model

### `PathfinderCharacterConfig` — Migration Required

The existing model is missing `guildId` (multi-guild isolation), an active-character flag, and tracking timestamps. Evolved model:

```prisma
model PathfinderCharacterConfig {
  id           String    @id @default(auto()) @map("_id") @db.ObjectId
  guildId      String                          // guild scope
  ownerId      String                          // Discord user ID
  name         String                          // character display name
  sheetUrl     String                          // full Google Sheets URL
  isActive     Boolean   @default(false)       // used by /character info for stable active pointer
  registeredAt DateTime  @default(now())
  lastUsedAt   DateTime?                       // updated on every roll that reads this sheet

  @@index([guildId, ownerId])
  @@unique([guildId, ownerId, name])           // one record per name per player per guild
}
```

Characters are **guild-scoped** — a player may register different characters in different servers without cross-contamination. There is no hard limit on the number of characters per user per guild.

### `PathfinderSheetConfig` — No Schema Change

This model already stores a per-guild versioned schema that maps Pathfinder stat names to Sheets cell references and named ranges. The default config at `src/config/default/PathfinderSheetConfig.json` covers:

| Category | Lookup Method |
|---|---|
| Ability score modifiers | Named ranges (`Strength`, `Dexterity`, …) |
| Saves (Fort / Ref / Will) | Cell refs (`F17`, `F18`, `F19`) |
| CMB | Cell ref (`B34`) |
| BAB | Named range `BaseAttack` |
| Initiative | Cell ref (`O38`) |
| Each skill (Acrobatics … Swim) | Cell refs (`AJ9`–`AJ39`) |
| Offense rows — 6 entries (rows 26–31) | Name: col `E`; Attack: col `O`; Damage: col `V`; Damage type: col `AB`; Crit: col `Y`; Multiplier: col `Z`; Range: col `AA` |
| AC / defenses (AC, flat-footed, touch, CMD) | Cell refs (`R17`–`R20`) |

Any cell on the sheet is directly addressable via standard A1 notation (e.g., `[C32]`) — see [Direct Cell Reference](#direct-cell-reference).

---

## Google Sheets Integration

### Authentication

A Google service account is used. The sheet owner **must** share each sheet with the service account email before registering it. The bot never stores sheet data — every stat reference triggers a live API call at roll time.

Required env vars (existing, already in schema):

| Env Var | Purpose |
|---|---|
| `GOOGLE_ACCOUNT_EMAIL` | Service account client email |
| `GOOGLE_PRIVATE_KEY` | Service account private key (PEM) |

**Library**: `googleapis` npm package (`google.sheets('v4')`).

### Registration Validation

When a player registers a character, the registration step performs a validation read **before** persisting anything:

1. The URL is a valid Google Sheets URL and a sheet ID can be extracted from it.
2. A `spreadsheets.values.get` call for the name cell (`B2`) succeeds without a 403/404 — confirming the service account has read access.
3. The configured tab (`sheetName` from `PathfinderSheetConfig`) exists in the spreadsheet.

If any check fails, registration is rejected with a descriptive user-facing error, e.g.:
> *"Could not access this sheet. Please share it with `bot@project.iam.gserviceaccount.com` and try again."*

### Data Retrieval at Roll Time

Each roll that uses stat references makes **one batched** `spreadsheets.values.batchGet` call containing every required range in a single HTTP request. Named ranges are resolved by calling `spreadsheets.get` at the start of each roll and reading the `namedRanges` array from the response. This is never cached between calls, satisfying the "live values at roll time" requirement. If no guild-specific `PathfinderSheetConfig` exists, the default `v1.0.0` config from disk is used.

---

## Roll Syntax Extension

### Principle

The notation string is pre-processed **before** being passed to `@dice-roller/rpg-dice-roller`. Stat and skill references are substituted with live values read from the character's Google Sheet; the resulting string is then rolled normally.

### Multi-Roll (semicolon separator)

Semicolons separate independent roll expressions within a single invocation:

```
1d20+5 ; 1d20+[fly] ; 1d20+1d4
```

Each segment is:
1. Trimmed of leading/trailing whitespace.
2. Resolved independently (token substitution, iterative-attack expansion).
3. Rolled as a separate `DiceRoll`.

All results are combined into **a single embed** with one field per roll. If a segment contains `[Name:ATK]` with no index and the attack cell has slash-delimited iteratives, each iterative attack gets its own field within the same embed (the first field for that segment labels itself `<notation> — 1st Attack`, subsequent fields `2nd Attack`, etc.).

Token resolution (character lookup, sheet API call) happens **once** for the whole invocation — all segments that need the active character share the same batch request. The notation (with semicolons) is stored in the reply cache so a bare `!roll` / `/roll` with no argument repeats the entire multi-roll.

Single-segment input (no semicolons) behaves exactly as before.

### Principle (single-segment)

The notation string is pre-processed **before** being passed to `@dice-roller/rpg-dice-roller`. Stat and skill references are substituted with live values read from the character's Google Sheet; the resulting string is then rolled normally.

Stat and skill references may be written either:
- **Bracketed** (classic form): `[STR]`, `[perc]`, `[fort]`
- **Bare** (shorthand form): `STR`, `perc`, `fort`

Bare aliases are normalised to bracket form internally before any other processing occurs — both styles are fully equivalent and may be freely mixed in the same expression. **Offense references (`Name:ATK`, `Name:DMG`) always require brackets** and are never matched as bare tokens.

A roll with no stat/skill references (bracketed or bare) behaves identically to the current command — no character lookup occurs whatsoever.

### Token Grammar

```
token         ::= "[" ref "]"           (full bracketed form)
              |   bare_stat_ref          (shorthand — no brackets; stats and skills only)
ref           ::= cell_ref | offense_ref | stat_ref
cell_ref      ::= column_letters row_number          (standard A1 notation, e.g. C32, AJ9)
offense_ref   ::= name ":" offense_type [ ":" attack_index ]
offense_type  ::= "ATK" | "ATTACK" | "DMG" | "DAMAGE"
attack_index  ::= positive integer  (1-based; only valid with ATK)
stat_ref      ::= <any string>  — matched case-insensitively against the alias table
bare_stat_ref ::= stat_ref | skill_alias  — word-boundary match, NOT including offense refs
```

Bare stat/skill aliases are normalised to `[alias]` form before token resolution begins, so both forms traverse the same pipeline. Offense references (`Name:ATK`, `Name:DMG`) always require the explicit `[…]` wrapper.

Resolution order for a `[token]`:
1. If the token matches the A1 cell-reference pattern (one or more letters followed by digits), treat it as a direct cell lookup.
2. Otherwise, attempt to match against the stat/skill alias table.
3. Otherwise, attempt to match as an offense reference.

Multiple tokens may appear in a single notation string, and both bracket and bare forms may be freely mixed:

```
1d20 + [STR]                  (bracketed)
1d20 + STR                    (bare — equivalent)
1d20 + [Perception]
1d20 + perc                   (bare skill alias)
1d20 + [STR] + BAB            (mixed: bracketed STR, bare BAB)
1d20 + STR + BAB              (both bare)
1d20 + [Longsword:ATK]        (offense — brackets required)
1d20 + [Longsword:ATK:2]
[Longsword:DMG]
```

### Stat Reference Alias Table

| Canonical | Accepted Aliases (case-insensitive) | Sheet Lookup |
|---|---|---|
| `STR` | `strength`, `str` | Named range `Strength` |
| `DEX` | `dexterity`, `dex` | Named range `Dexterity` |
| `CON` | `constitution`, `con` | Named range `Constitution` |
| `INT` | `intelligence`, `int` | Named range `Intelligence` |
| `WIS` | `wisdom`, `wis` | Named range `Wisdom` |
| `CHA` | `charisma`, `cha` | Named range `Charisma` |
| `FORT` | `fortitude`, `fort` | Schema cell `F17` |
| `REF` | `reflex`, `ref` | Schema cell `F18` |
| `WILL` | `will` | Schema cell `F19` |
| `CMB` | `cmb` | Schema cell `B34` |
| `BAB` | `bab`, `baseattack` | Named range `BaseAttack` |
| `INIT` | `initiative`, `init` | Schema cell `O38` |
| `<Skill Name>` | See skill alias table below | Schema skill cell |
| `[A1]` | Any valid A1-notation cell address (e.g., `[C32]`, `[AJ9]`) | Direct cell lookup — no alias matching |

All matched values are expected to resolve to signed integers (e.g., `+5`, `-1`, `7`). If a resolved cell is empty, non-numeric, or cannot be parsed, the command surfaces an error naming the specific token that failed.

### Skill Alias Table

| Skill | Cell | Accepted Aliases (case-insensitive) |
|---|---|---|
| Acrobatics | `AJ9` | `acro` |
| Appraise | `AJ10` | `appr` |
| Bluff | `AJ11` | `bluff` |
| Climb | `AJ12` | `climb` |
| Diplomacy | `AJ13` | `diplo` |
| Disable Device | `AJ14` | `dd`, `disable` |
| Disguise | `AJ15` | `disg` |
| Escape Artist | `AJ16` | `ea`, `escape` |
| Fly | `AJ17` | `fly` |
| Handle Animal | `AJ18` | `ha`, `handle` |
| Heal | `AJ19` | `heal` |
| Intimidate | `AJ20` | `intim` |
| Kn. Spheric | `AJ21` | `ksph`, `spheric`, `kn.spheric` |
| Kn. Dungeoneering | `AJ22` | `kdung`, `dungeon`, `kn.dungeon` |
| Kn. Engineering | `AJ23` | `keng`, `engineer`, `kn.engineering` |
| Kn. Geography | `AJ24` | `kgeo`, `geography`, `kn.geography` |
| Kn. History | `AJ25` | `khist`, `history`, `kn.history` |
| Kn. Local | `AJ26` | `kloc`, `local`, `kn.local` |
| Kn. Nature | `AJ27` | `knat`, `nature`, `kn.nature` |
| Kn. Nobility | `AJ28` | `knob`, `nobility`, `kn.nobility` |
| Kn. Religion | `AJ29` | `krel`, `religion`, `kn.religion` |
| Linguistics | `AJ30` | `ling` |
| Perception | `AJ31` | `perc` |
| Piloting | `AJ32` | `pilot` |
| Ride | `AJ33` | `ride` |
| Sense Motive | `AJ34` | `sm`, `sense` |
| Sleight of Hand | `AJ35` | `soh`, `sleight` |
| Spheric Combat | `AJ36` | `sc`, `sphcombat` |
| Stealth | `AJ37` | `stealth` |
| Survival | `AJ38` | `surv` |
| Swim | `AJ39` | `swim` |

All full skill names and all listed aliases resolve to the same cell. Matching is performed after the cell-reference pattern check and before offense matching.

### Direct Cell Reference

A token whose content matches the A1 pattern (`[A-Za-z]+[0-9]+`, e.g., `[C32]`, `[AJ9]`, `[O38]`) is treated as a direct cell lookup against the character's sheet tab. No alias matching is attempted. This is the escape hatch for any value on the sheet not covered by the alias table.

Examples:
```
1d20 + [C32]      — reads whatever is in cell C32
[AJ31]            — reads Perception directly by cell address
```

### Offense References

The Offenses table occupies **rows 26–31** of the sheet (six possible offense entries). Each row contains the following columns, read as a unit when any offense token is resolved:

| Field | Column | Example value |
|---|---|---|
| **Name** | `E` | `Longsword`, `Claw`, `Ray of Frost` |
| **Attack bonus** | `O` | `+12/+7/+2` or `+5` |
| **Damage** | `V` | `1d8+4`, `2d6+3` |
| **Damage type** | `AB` | `slashing`, `fire`, `cold` |
| **Crit range** | `Y` | `19-20`, `20` |
| **Crit multiplier** | `Z` | `×2`, `×3` |
| **Range** | `AA` | `—`, `30 ft.` |

The full cell layout for all six rows:

| Row | Name | Attack | Damage | Dmg Type | Crit | Mult | Range |
|---|---|---|---|---|---|---|---|
| 1 | `E26` | `O26` | `V26` | `AB26` | `Y26` | `Z26` | `AA26` |
| 2 | `E27` | `O27` | `V27` | `AB27` | `Y27` | `Z27` | `AA27` |
| 3 | `E28` | `O28` | `V28` | `AB28` | `Y28` | `Z28` | `AA28` |
| 4 | `E29` | `O29` | `V29` | `AB29` | `Y29` | `Z29` | `AA29` |
| 5 | `E30` | `O30` | `V30` | `AB30` | `Y30` | `Z30` | `AA30` |
| 6 | `E31` | `O31` | `V31` | `AB31` | `Y31` | `Z31` | `AA31` |

At resolve time, the bot reads **all six `E` column cells** (`E26:E31`) in a single batch call. Rows where the `E` cell is empty are skipped entirely.

#### Name Matching

`[Name:ATK]`, `[Name:ATK:n]`, and `[Name:DMG]` perform **fuzzy matching** (case-insensitive, substring/prefix) against the non-empty name cells in column `E`. Matching priority:

1. **Exact match** (case-insensitive) — `[Longsword:ATK]` against `Longsword`.
2. **Prefix match** — `[Long:ATK]` matches `Longsword`.
3. **Substring match** — `[sword:ATK]` matches `Longsword`.

If more than one non-empty row scores equally under these rules, the bot replies with the ambiguous candidates and asks the user to be more specific:
> *"Ambiguous offense name 'sword' — did you mean: Longsword, Shortsword?"*

#### Attack — `[Name:ATK]` / `[Name:ATK:n]`

Resolves column `O` for the matched row. The sheet stores iterative attacks as a slash-delimited string (e.g., `+12/+7/+2` for a three-attack full-attack sequence). Parsing rules:

- If the value contains no `/`, treat the entire value as a single attack bonus.
- If the value contains `/`, split on `/` to produce an ordered list of bonuses.
- `[Name:ATK]` with **no index** triggers **full-attack expansion**: each iterative bonus
  is rolled as a separate `DiceRoll`, and all results are combined into a single embed
  with one field per attack ("1st Attack", "2nd Attack", "3rd Attack", …). No sheet
  values are re-fetched; all rolls share the single batch request made at the start of
  the command invocation.
- `[Name:ATK:n]` selects **only** the n-th bonus (1-based) and rolls a single result.
  If `n` exceeds the number of available attack steps, the command errors:
  > *"Only 2 iterative attacks found for Longsword."*

Resolution examples:

```
1d20 + [Longsword:ATK]    →  full-attack: rolls 1d20+12, 1d20+7, 1d20+2 separately
1d20 + [Longsword:ATK:1]  →  single roll: 1d20 + 12
1d20 + [Longsword:ATK:2]  →  single roll: 1d20 + 7
1d20 + [Longsword:ATK:3]  →  single roll: 1d20 + 2
```

#### Damage — `[Name:DMG]`

Resolves columns `V` (damage dice) and `AB` (damage type) for the matched row. These two cells are combined to produce the complete damage expression.

Parsing:
1. Read `V` (e.g., `1d8+4`) — this is the dice notation component and is passed verbatim to `@dice-roller/rpg-dice-roller`.
2. Read `AB` (e.g., `slashing`) — this is the damage type label and is stored separately. If `AB` is empty, no type label is shown.
3. The `V` value is substituted into the roll expression and rolled as real dice.
4. The `AB` type label is appended to the embed result line.

Examples:

```
[Longsword:DMG]   →  rolls 1d8+4,  shows "9 slashing"
[Fireball:DMG]    →  rolls 6d6,    shows "21 fire"
[Claw:DMG]        →  rolls 1d6+3,  shows "7"  (no type if AB26 is empty)
```

> **Note on the damage cell format:** Column `V` should contain only the dice expression (e.g., `1d8+4`, `2d6+3`). The damage type lives exclusively in column `AB`. If the sheet instead embeds the type within `V` (e.g., `1d8+4 slashing`), the parser will attempt to strip the trailing non-numeric suffix and use it as the type — but relying on column `AB` is the canonical approach.

### Embed Output

**Single roll** — original tokenised expression and fully substituted notation:

> **Dice roll:** `1d20 + [Perception]`
> *(resolved: `1d20 + 11`)*
> Buddy got **17**!
> `[18, -1]`
> Footer: *Sylphie · Buddy*

**Damage roll** with type suffix:

> **Dice roll:** `[Longsword:DMG]`
> *(resolved: `1d8+4` — **slashing**)*
> Buddy dealt **9** slashing!
> `[5, +4]`
> Footer: *Sylphie · Buddy*

**Full-attack** (`[Name:ATK]` with no index) — one field per iterative:

> **Full attack:** `1d20 + [Longsword:ATK]`
> ┌ **1st Attack** ─ **24** │ `[12, +12]`
> ├ **2nd Attack** ─ **15** │ `[8, +7]`
> └ **3rd Attack** ─ **4**  │ `[2, +2]`
> Footer: *Sylphie · Buddy*

**Multi-roll** (`1d20+5 ; 1d20+[fly] ; 1d20+1d4`) — one field per segment, single embed:

> **Dice roll:** `1d20+5 ; 1d20+[fly] ; 1d20+1d4`
> ┌ **1d20+5** ─ **18** │ `[13, +5]`
> ├ **1d20+[fly]** ─ **23** │ `[17, +6]`
> └ **1d20+1d4** ─ **14** │ `[11, +3]`
> Footer: *Sylphie · Buddy*

A multi-roll segment that itself expands to iterative attacks shows the first attack field as `<notation> — 1st Attack` with subsequent fields `2nd Attack`, `3rd Attack`, … all within the same embed.

When a character is active but the notation contains no tokens, the character name still appears in the footer (best-effort lookup; never causes an error).

When no character is registered or set, the footer shows only the username.

### Re-roll Button — Removed

The re-roll button is **not** included on any roll response. Because stat resolution is live, a re-roll could silently use different values if the sheet changed between invocations, which would be confusing. The button is also removed from plain dice rolls as a simplification of the overall UX.

---

## Command Structure

### `/roll` (modified)

`/roll [notation] [character]`

| Option | Type | Required | Description |
|---|---|---|---|
| `notation` | string | No | Dice notation, optionally containing `[StatRef]` tokens |
| `character` | string | No | Override the character used for this roll only (does not persist) |

#### Character Resolution Order

When `[…]` tokens appear in the notation, the command resolves which character to use in the following priority order:

1. **Explicit `character` argument** — if provided, look up that character by name in the invoking user's registry for this guild. Error if not found.
2. **Most recently used character** — if no argument is given, query `PathfinderCharacterConfig` for `{ guildId, ownerId }` ordered by `lastUsedAt DESC` and take the first result.
3. **No character found** — if neither of the above yields a result and `[…]` tokens are present, the command errors:
   > *"No character found. Register one with `/character register` or specify one with the `character` option."*

When **no stat/skill references are present** (neither bracketed `[…]` tokens nor bare aliases), all three steps are skipped — the roll executes without any sheet lookup regardless of whether any characters are registered.

#### Effect on `lastUsedAt`

Every successful roll that resolves a character (via either the explicit argument or the most-recently-used fallback) updates that character's `lastUsedAt` to `now()`. This keeps the fallback chain self-maintaining without requiring an explicit `/character activate` step from the user.

#### Relationship to `isActive`

`isActive` is used by `/character info` (when no name is given) and by `/character unregister` (to determine which character to auto-promote after removal). It is **not** used by `/roll` — `/roll` exclusively uses `lastUsedAt` for its implicit character selection. A player's "active roll character" naturally tracks usage without manual management, while `isActive` provides a stable explicit pointer for inspection commands.

#### Autocomplete

The `character` option uses Discord autocomplete filtered server-side to only the invoking user's registered characters in this guild (`{ guildId, ownerId: interaction.user.id }`). Characters are ordered by `lastUsedAt DESC` so the most recently used character appears at the top of the list. User A will never see User B's characters. Prefix `!roll` supports `[…]` tokens and bare stat/skill aliases for the most recently used character only — the `character` override is slash-only.

---

### `/character` (new command group)

#### `/character register <sheet_url> <name>`

Registers a new character for the invoking user in the current guild.

| Option | Type | Required | Description |
|---|---|---|---|
| `sheet_url` | string | Yes | Full Google Sheets URL |
| `name` | string | Yes | Display name for this character |

- Validates sheet access before persisting anything (see [Registration Validation](#registration-validation)).
- If this is the user's first character in this guild, automatically sets `isActive = true`.
- If a record with the same `(guildId, ownerId, name)` already exists, updates the `sheetUrl` (re-registration).

---

#### `/character unregister <name>`

Removes the named character from the user's registry in this guild.

| Option | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Character name to remove |

The `name` option uses Discord autocomplete filtered to the invoking user's characters. If the removed character was `isActive`, the most recently registered remaining character is automatically promoted to active. If none remain, the active slot is left empty.

---

#### `/character list`

Lists all characters the invoking user has registered in this guild. Displayed as an embed with one field per character showing name, abbreviated sheet URL, active status, and last-used date.

No options.

---

#### `/character use <name>`

Sets the named character as the active character for rolls in this guild. This is the primary way to switch which character `/roll` uses for token substitution and embed display.

| Option | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Character name to set as active for rolls |

- Sets `isActive = true` (clears `isActive` on all other characters owned by this user in this guild).
- Also bumps `lastUsedAt` to `now()` so this character wins the `lastUsedAt` fallback immediately after being selected.
- Replies ephemerally with a confirmation.
- The `name` option uses Discord autocomplete filtered to the invoking user's registered characters in this guild.

---

#### `/character unequip`

Clears the active character for the invoking user in this guild. After this command no character has `isActive = true` until the user runs `/character use` again. Useful when the player wants to roll plain dice without a character name appearing in the footer.

No options.

---

#### `/character info [name]`

Fetches the live character sheet for the named character (or the `isActive` character if no name is provided) and renders a rich embed showing all resolved stats at that moment. Uses a single batched `batchGet` call.

| Option | Type | Required | Description |
|---|---|---|---|
| `name` | string | No | Character name; defaults to the `isActive` character |

The `name` option uses Discord autocomplete filtered to the invoking user's characters.

The embed is organised into sections:

| Section | Fields shown |
|---|---|
| **Identity** | Character name (from sheet `B2`), Level, HP |
| **Ability Scores** | STR / DEX / CON / INT / WIS / CHA modifiers |
| **Saves** | Fort / Ref / Will totals |
| **Offenses** | Name, Attack string, Damage, Crit, Type — one inline field per non-empty offense row |
| **Defenses** | AC / Flat-footed / Touch / CMD |
| **Combat** | BAB, CMB, Initiative |
| **Skills** | Two-column layout of all non-empty skill totals |

The embed footer shows the fetch timestamp and character name.

---

#### `/character admin list-all` *(owner only)*

Lists all `PathfinderCharacterConfig` records in the current guild, grouped by user mention. Restricted via the existing `OwnerOnly` precondition (`src/preconditions/OwnerOnly.ts`).

No options.

---

#### `/character admin register <user> <sheet_url> <name>` *(owner only)*

Registers a character on behalf of another user. Same validation and persistence logic as `/character register`, with `ownerId` set to the target user rather than the invoker.

| Option | Type | Required | Description |
|---|---|---|---|
| `user` | User | Yes | Target Discord user |
| `sheet_url` | string | Yes | Full Google Sheets URL |
| `name` | string | Yes | Character display name |

---

#### `/character admin unregister <user> <name>` *(owner only)*

Forcibly removes a character from another user's registry. Same active-promotion logic as `/character unregister`.

| Option | Type | Required | Description |
|---|---|---|---|
| `user` | User | Yes | Target Discord user |
| `name` | string | Yes | Character name to remove |

The `name` option autocompletes from the selected `user`'s registered characters (Discord resolves the `user` option before autocomplete fires for `name`).

---

### Full Command Map

```
/roll [notation]

/character register          <sheet_url> <name>
/character unregister        <name>
/character list
/character use               <name>
/character unequip
/character info              [name]
/character admin list-all
/character admin register    <user> <sheet_url> <name>
/character admin unregister  <user> <name>
```

The `admin` subcommands map to a Discord slash **subcommand group**, giving a three-level structure (e.g., `/character admin register`). All non-admin subcommands are flat children of `/character`.

---

## File & Module Layout

```
src/
  commands/
    rng/
      DiceRollCommand.ts          ← modified: token pre-processor, character resolution,
                                               re-roll button removed
    pathfinder/                   ← new folder
      CharacterCommand.ts         ← /character command group (all subcommands + admin group)
  lib/
    structures/
      managers/
        PathfinderManager.ts      ← new: DB CRUD helpers
                                         (register / unregister / list / activate / getLastUsed)
    utils/
      sheets.ts                   ← new: Google Sheets API client, batchGet helper,
                                         named-range resolver
      pathfinderRoll.ts           ← new: token parser, alias resolution, offense fuzzy-match,
                                         ATK iterative-attack splitter, DMG type parser,
                                         substitution engine
prisma/
  schema.prisma                   ← PathfinderCharacterConfig evolution:
                                     add guildId, isActive, registeredAt, lastUsedAt
src/config/default/
  PathfinderSheetConfig.json      ← unchanged
```

### Autocomplete Wiring

`CharacterCommand` registers an `autocompleteRun` method. The handler inspects `interaction.options.getFocused(true)` to identify the focused option, then queries `PathfinderManager` with `{ guildId, ownerId: interaction.user.id }` to return only that user's characters, ordered by `lastUsedAt DESC`. For owner-only admin subcommands that accept a `user` + `name` pair, the `name` autocomplete reads the already-resolved `user` option (`interaction.options.getUser('user')`) and queries by that user's ID instead.

---

## Behaviour Invariants

- A roll with no stat/skill references (no `[…]` tokens and no bare aliases) never *requires* a character — the roll always succeeds. The bot still performs a best-effort character lookup to show the character name in the footer, but this lookup never errors.
- Bare stat/skill aliases (`STR`, `perc`, `fort`, etc.) are treated as equivalent to their bracketed forms. Offense references (`Name:ATK`, `Name:DMG`) always require explicit `[…]` brackets.
- The re-roll button is not present on any roll response.
- Both `/roll` (slash) and `!roll` (prefix) support `[…]` tokens and bare stat/skill aliases. Character resolution uses `isActive` first, then `lastUsedAt` as a fallback; there is no per-invocation character override on either form.
- The `PathfinderSheetConfig` for the guild is loaded once per command invocation from the database; if no guild-specific config exists, the default `v1.0.0` config from disk is used.
- Stat values are always read fresh from the live sheet — there is no persistent or in-process caching of sheet values.
- `isActive` is written by: `/character use` (explicit user choice, clears all others), `/character unequip` (clears all), `/character unregister` (auto-promotion of remaining character), and `/character register` (auto-set on first registration). It is read by `/character info` when no name is given.
- `lastUsedAt` is written by: `/roll` (after a successful token-substitution roll) and `/character use` (to ensure the newly activated character also wins the fallback immediately). It serves as the **fallback** character selector in `/roll` when no character has `isActive = true`.
