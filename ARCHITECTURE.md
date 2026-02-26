# PuppyBot — Architecture & Feature Reference

> Last updated: 2026-02-25

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Environment Variables](#environment-variables)
4. [Startup Sequence](#startup-sequence)
5. [Per-Guild Subsystems](#per-guild-subsystems)
6. [Global Subsystems](#global-subsystems)
7. [Command Reference](#command-reference)
8. [Base Command Classes](#base-command-classes)
9. [Scheduled Tasks](#scheduled-tasks)
10. [Event Listeners](#event-listeners)
11. [Data Model (Prisma / MongoDB)](#data-model-prisma--mongodb)
12. [Project Layout](#project-layout)

---

## Overview

PuppyBot is a multi-guild Discord bot built on the [Sapphire Framework](https://www.sapphirejs.dev/)
(which wraps [discord.js v14](https://discord.js.org/)). It combines:

- **Fun / meme commands** — Python-generated images and random reaction media.
- **Music playback** — YouTube, SoundCloud, Bandcamp, Twitch, and Vimeo via Lavalink/Shoukaku.
- **Custom command system** — Per-guild text responses registered by members.
- **Reminder system** — One-time and recurring reminders to users, roles, or channels.
- **Battle / trap system** — A passive text-game where users hide trap phrases and deal damage to other members.
- **Admin utilities** — Group-channel creation, emoji usage analytics, role-assignment, and message audit logging.

---

## Technology Stack

| Layer | Library / Service |
|---|---|
| Bot framework | [Sapphire Framework](https://www.sapphirejs.dev/) + discord.js v14 |
| Database | MongoDB via [Prisma](https://www.prisma.io/) |
| Job queue (reminders, regen tasks) | Redis + [Bull](https://github.com/OptimalBits/bull) via `@sapphire/plugin-scheduled-tasks` |
| Music backend (audio server) | [Lavalink](https://lavalink.dev/) — standalone Java audio server |
| Music client (Node.js ↔ Lavalink) | [Shoukaku](https://github.com/shipgirlproject/Shoukaku) v4 |
| Per-guild music queue | `GuildMusicQueue` — lightweight in-memory state map on `client.musicQueue` |
| Image generation (memes) | Python scripts called via `python-shell` |
| Error tracking | [Sentry](https://sentry.io/) (`@sentry/node`) — optional |
| Environment validation | [Zod](https://zod.dev/) schema (`src/lib/env/schema.ts`) |
| Language | TypeScript (compiled with `tsc`) |
| Runtime | Node.js |

### Sapphire plugins in use

| Plugin | Purpose |
|---|---|
| `@sapphire/plugin-logger` | Structured console logging |
| `@sapphire/plugin-editable-commands` | Prefix commands re-run on edit |
| `@sapphire/plugin-api` | REST API routes (mounted at `src/lib/routes/`) |
| `@sapphire/plugin-scheduled-tasks` | Bull-backed job scheduling |
| `@sapphire/plugin-subcommands` | Slash + prefix subcommand routing |

### Music system — Lavalink + Shoukaku

The bot's music backend is a two-tier architecture:

- **Lavalink** is an external Java process (`lavalink/Lavalink.jar`) configured via
  `lavalink/application.yml`. It handles all audio fetching, decoding, and streaming
  entirely outside the Node.js process. This isolates audio work from the bot process
  and prevents audio-processing CPU spikes from impacting command responsiveness.
- **Shoukaku** (`shoukaku` npm package) is the Node.js WebSocket client that connects
  to the Lavalink server. It exposes a `Player` per guild (connected to a voice channel)
  and a `Rest` API for track resolution.

Track resolution uses `node.rest.resolve(identifier)`, where `identifier` is either
a raw URL or a `ytsearch:<query>` string. Shoukaku does **not** provide a built-in
queue; per-guild queue state is maintained by `GuildMusicQueue` objects stored in
the `client.musicQueue` Map (declared in `augments.d.ts`).

Player lifecycle events (`end`, `exception`) are registered inline in the `/play`
command when the player is first created for a guild. On track end, the queue
advances automatically; when the queue is empty the bot leaves the voice channel
and the queue entry is removed from the map.

**Lavalink audio sources** (configured in `lavalink/application.yml`):

| Source | Enabled |
|---|---|
| YouTube | ✅ (via `youtube-plugin` v1.11.3; uses `MUSIC`, `WEB`, `ANDROID_TESTSUIT` clients) |
| SoundCloud | ✅ |
| Bandcamp | ✅ |
| Twitch | ✅ |
| Vimeo | ✅ |
| Generic HTTP streams | ✅ |
| Local files | ❌ |

**Lavalink audio filters** (all enabled in server config):

`volume`, `equalizer`, `karaoke`, `timescale`, `tremolo`, `vibrato`, `distortion`,
`rotation`, `channelMix`, `lowPass`

---

## Environment Variables

All variables are declared and validated in `src/lib/env/schema.ts` using a
[Zod](https://zod.dev/) schema. The schema is parsed once at startup; any missing
required variable throws immediately with a descriptive error rather than failing
silently. Typed helper wrappers in `src/lib/env/utils.ts` read from the parsed
`env` object for call sites that pre-date the Zod migration.

| Variable | Type | Default | Description |
|---|---|---|---|
| `TOKEN` | string | — | Discord bot token |
| `CLIENT_PREFIX` | string | `!` | Default command prefix |
| `CLIENT_OWNERS` | string (space-separated IDs) | `''` | Owner user IDs; bypasses cooldowns |
| `CLIENT_ID` | string | — | Discord application / client ID |
| `DEV_GUILD_ID` | string | — | Guild where guild-scoped slash commands are registered in dev |
| `CLIENT_NAME` | string | optional | Display name override for the bot |
| `CLIENT_VERSION` | string | optional | Version string surfaced in logs/presence |
| `CLIENT_PRESENCE_NAME` | string | optional | Custom activity name override |
| `CLIENT_PRESENCE_TYPE` | string | optional | Custom activity type override |
| `MONGO_URL` | string | — | MongoDB connection string |
| `REDIS_URL` | string | — | Redis host |
| `REDIS_PORT` | integer | `6379` | Redis port |
| `REDIS_PASSWORD` | string | — | Redis password |
| `REDIS_DB` | integer | `0` | Redis database index |
| `SENTRY_URL` | string | optional | Sentry DSN — Sentry is disabled when absent |
| `BATTLESYSTEM_INTERVAL_SECS` | integer | `300` | How often (seconds) battle-system HP/energy regenerates |
| `DEFAULT_TIMEZONE` | `eastern` \| `pacific` \| `utc` | `eastern` | Timezone for reminder parsing |
| `SOUNDCLOUD_TOKEN` | string | optional | SoundCloud API token (for enhanced SoundCloud resolution) |
| `LAVALINK_HOST` | string | `localhost` | Hostname of the Lavalink server |
| `LAVALINK_PORT` | integer | `2333` | Port of the Lavalink server |
| `LAVALINK_PASSWORD` | string | `youshallnotpass` | Lavalink server password |
| `LAVALINK_SECURE` | boolean | `false` | Whether to use wss:// / https:// to reach Lavalink |
| `LAVALINK_ENABLED` | boolean | `true` | Set to `false` to skip music system initialization entirely |
| `LOG_DEBUG` | boolean | optional | Enable debug-level logging |
| `LOG_INFO` | boolean | optional | Enable info-level logging |
| `LOG_WARN` | boolean | optional | Enable warn-level logging |
| `DOTENV_DEBUG_ENABLED` | boolean | optional | Log parsed dotenv values on startup |
| `GOOGLE_ACCOUNT_EMAIL` | string | optional | Google service account (future integrations) |
| `GOOGLE_PRIVATE_KEY` | string | optional | Google service account private key |
| `CHALLONGE_TOKEN` | string | optional | Challonge tournament API token (inactive) |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` | Runtime environment flag |

---

## Startup Sequence

```
src/index.ts
  ├── Sentry.init() (if SENTRY_URL set)
  │     ├── modulesIntegration
  │     ├── consoleIntegration
  │     └── linkedErrorsIntegration
  ├── import './lib/setup'  ← Sapphire plugin registration; must precede PuppyBotClient
  └── PuppyBotClient constructor
        ├── super(CLIENT_OPTIONS)   ← SapphireClient with intents, partials, cooldowns, Bull config
        └── this.musicQueue = new Map()   ← empty per-guild queue registry

  client.login(TOKEN)
    ├── container.database = new PrismaClient()
    ├── database.$connect()
    ├── _initMusic()   ← only if LAVALINK_ENABLED=true
    │     ├── new Shoukaku(DiscordJS connector, [{ name:'Main', url:'host:port', auth }], options)
    │     ├── shoukaku.on('error', ...)   ← logs Lavalink node errors
    │     └── shoukaku.on('ready', ...)   ← logs when a Lavalink node becomes available
    └── super.login()   ← discord.js WebSocket handshake
          └── Events.ClientReady fires
                ├── ReadyLoadGuildData  (src/listeners/client/ready/loadGuildData.ts)
                │     └── For each joined guild → GuildCreateGuildInitialize.loadGuild()
                │           ├── GuildSettingsManager.loadSettings()
                │           ├── BattleSystem.loadConfig() + loadFromDB() + writeToDB()
                │           ├── GuildMessageScanner instantiated (guild.scanner)
                │           ├── EmojiUsageManager.loadRecords() + loadRegistry() + generateLastMessageStore()
                │           ├── RoleAssignmentManager.loadConfig() + generateMessageCollectors()
                │           ├── MessageEchoManager.loadConfig()
                │           ├── GuildLeaveAnnouncerManager.loadConfig()
                │           └── CustomCommandSystem.loadFromDB()
                └── ReadyLoadGlobalSystems  (src/listeners/client/ready/loadGlobalSystems.ts)
                      ├── ReminderManager instantiated on client.reminders
                      └── ReminderManager.loadData()
                            ├── Loads all non-disabled reminders from MongoDB
                            └── Re-queues pending Bull jobs (survives process restarts)
```

When the bot **joins a new guild** after startup, the `GuildCreate` event fires
`GuildCreateGuildInitialize.loadGuild()` and runs the same full initialization path.

Each initialization step is individually try/caught so that a failure in one
subsystem (e.g., a guild with no BattleConfig) does not abort initialization
for remaining subsystems.

---

## Per-Guild Subsystems

Every guild has its own instance of each manager, stored as properties on the
discord.js `Guild` object (declared in `src/lib/types/augments.d.ts`).

### `GuildSettingsManager` (`src/lib/structures/managers/GuildSettingsManager.ts`)

Persists and exposes guild-level configuration.

| Field | Description |
|---|---|
| `prefix` | Command prefix for this guild (falls back to `CLIENT_PREFIX`) |
| `timezone` | Guild timezone override for reminder display |
| `accountChannelId` | Channel used to post moderation/account-related messages |

Provides `set(partial)` for atomic DB updates and `createChannel()` for provisioning
new Discord channels.

The dynamic prefix resolver on `PuppyBotClient.fetchPrefix` queries
`GuildSettings.prefix` from MongoDB on every prefix-command message, falling back
to `CLIENT_PREFIX` if no guild record exists.

### `BattleSystem` (`src/lib/structures/managers/BattleSystem.ts`)

A passive text-game embedded in normal chat. Each guild member can become a
`BattleUser` with stats (health, energy, experience, level). Users place hidden
*trap* phrases; when another user types a matching phrase in any guild channel,
the trap fires and deals damage. Experience is awarded to trap creators.

Key elements:

- **BattleUser** — HP, energy, XP, level; persisted in `BattleUser` MongoDB model.
  Stats are loaded into memory at startup and written back on change.
- **Trap** — an armed phrase with a state machine (`Armed → Fired | Disarmed | Removed`).
  Stored in `BattleTrap` MongoDB model.
- **BattleTrapRecord** — immutable audit log of trap lifecycle events
  (`Create`, `Trigger`, `Disarm`, `Remove`), stored as an embedded array on the trap.
- **BattleConfig** — per-guild versioned configuration:
  - `levelConfigs` — XP thresholds, max HP/energy, trap slot count, regen rates per level.
  - `trapConfig` — trap channel, icon URLs, message TTL, damage formula.
  - `abilityConfigs` — energy and XP costs for `Gulag` and `Trap` abilities.
- **Damage formulae** — configurable via `BattleTrapDamageFormulaType`:
  - `Base` — flat damage scaled by character count and word count.
  - `Linear` — linearly scaled with a configurable scalar.
  - `Exponential` — exponentially scaled with a configurable scalar.
  - `Interval` — time-based damage multiplier; the longer a trap has been armed,
    the higher the scalar, using configurable `timeIntervals`.
- **Trap matching** — the `messageCreate` listener (`checkForTraps.ts`) scans every
  non-bot guild message for `Armed` trap phrases using a substring search. The original
  `Create` record payload is checked to ensure the trapping message itself does not
  trigger the trap again.
- **Trap disarm** — if the message begins with the `disarm` prefix command, matching
  traps are skipped by the trigger listener.
- **Regeneration** — the `BattleSystem_RegenerateUsers` Bull scheduled task fires
  periodically (every `BATTLESYSTEM_INTERVAL_SECS` seconds) to restore HP/energy
  for all `BattleUser` records across all guilds.
- **Abilities** — `Gulag` mutes a user; `Trap` places or manages traps. Each ability
  has configurable energy and XP requirements.

### `CustomCommandSystem` (`src/lib/structures/managers/CustomCommandSystem.ts`)

Manages per-guild custom text commands (name → text output).

- Commands and aliases are stored in a `CustomCommand` MongoDB model and
  cached in-memory in a `Map<name, CustomCommand>` at startup.
- All mutations (add, edit, remove, rename, alias) write-through to MongoDB and
  update the cache atomically so reads never need to hit the database.
- `getByNameOrAliasWithFallback()` falls back to querying MongoDB directly when
  the cache is empty, providing restart safety.
- The `messageCreate` listener (`checkForCustomCommands.ts`) inspects every
  non-bot guild message; if the content matches a registered command name or
  alias, the stored `content` string is sent to the channel.
- Custom commands are also invokable as prefix commands (e.g., `!mycommand`).

### `EmojiUsageManager` (`src/lib/structures/managers/EmojiUsageManager.ts`)

Tracks per-emoji, per-user usage counts across all guild message history.

- Extends `AGuildScannerRegistryOwner`: uses `GuildMessageScanner` to retrieve
  historical messages in batches and scans them for custom emoji occurrences.
- Usage data is persisted in the `GuildEmojiUsage` MongoDB model. The schema
  stores an `EmojiRecord[]` per guild, each with nested `EmojiUserRecord[]`
  (per user: `messageCount` and `reactionCount`).
- A `GuildScanRegistryRecord` tracks the last scanned message ID per channel
  so that re-scans only fetch new messages rather than the entire history.
- Triggered on demand via `/emojiusage` slash command or the `Track Emoji Usage`
  context-menu command on a user.
- `generateLastMessageStore()` pre-populates the last-seen message ID per
  channel using the registry, enabling incremental scans.

### `GuildMessageScanner` (`src/lib/structures/managers/GuildMessageScanner.ts`)

Low-level message batch-fetcher. Recursively paginates through all text channels
in a guild (batch size 100 messages, 20 s delay between channel fetches to avoid
rate-limit exhaustion) and emits chunk events consumed by `EmojiUsageManager`
and other subscribers.

At startup, the bulk startup-time message prefetch that previously triggered
rate-limit exhaustion has been removed. Scanning now only occurs on explicit
demand (command invocation or registry load).

### `RoleAssignmentManager` (`src/lib/structures/managers/RoleAssignmentManager.ts`)

Provides opt-in role assignment via message reactions in a designated channel.

- Config (stored in `RoleAssignConfig` MongoDB model): `roleChannelId`, `fetchOnLoad`.
- On load, if `fetchOnLoad` is true, fetches the role channel's message history
  and attaches `ReactionCollector` instances to each message.
- The `messageReactionAdd` listener calls the manager when a user reacts; the
  manager grants or revokes the role mapped to that reaction.

### `MessageEchoManager` (`src/lib/structures/managers/MessageEchoManager.ts`)

Forwards message edits and deletions to a designated audit-log channel.

- Config (stored in `MessageEchoConfig` MongoDB model): `outputChannelId`, `echoDeletes`, `echoEdits`.
- Toggles are set via the `/set logging` command.
- Active only when an `outputChannelId` is configured.

### `GuildLeaveAnnouncerManager` (`src/lib/structures/managers/GuildLeaveAnnouncerManager.ts`)

Posts a farewell message in a configured channel when a member leaves the guild.

- Config (stored in `LeaveAnnouncerConfig` MongoDB model): `outputChannelId`, `echoLeaves`.
- The `guildMemberRemove` listener triggers this manager.

---

## Global Subsystems

### `ReminderManager` (`src/lib/structures/managers/ReminderManager.ts`)

Singleton attached to `client.reminders`. Coordinates two persistence layers:

| Layer | Role |
|---|---|
| MongoDB (`Reminder`, `ReminderSchedule`, `ReminderEvent`) | Source of truth; persists across restarts |
| Redis / Bull (`@sapphire/plugin-scheduled-tasks`) | Execution engine; fires the job at the right wall-clock time |

**Data model:**

- `Reminder` — the top-level record. Stores owner ID, content, target, and a
  `jobId` referencing the most recent Bull job.
- `ReminderTarget` — an embedded type describing where the reminder fires:
  - `User` — the bot DMs the specified user IDs.
  - `Role` — the bot pings the role in the specified guild channel.
  - `Channel` — the bot sends to a specific channel with no mention.
- `ReminderSchedule` — the schedule for a reminder. Stores `reminderTime`
  (absolute UTC), a `ReminderRepeatSchedule` embedded type (`isRepeating`,
  `isInfinite`, `interval`), and a disabled flag.
- `ReminderEvent` — immutable append-only event log. Each event records a
  `DiscordLocation` (guild/channel/message) and a JSON payload. Event types:
  `Create`, `Fire`, `Reschedule`, `Stop`, `Subscribe`, `Unsubscribe`.

**Startup recovery:**  
`loadData()` reads all non-disabled reminders and re-enqueues their pending
`ReminderSchedule` records as Bull jobs. All pending reminders survive
a process restart without any data loss.

**Time parsing:**  
The `/reminder create` command accepts both natural-language strings
(e.g., `next Monday at 9am`, powered by `chrono-node`) and duration strings
(e.g., `in 2 hours`, powered by `@sapphire/time-utilities`). The `DEFAULT_TIMEZONE`
environment variable controls the timezone assumed during parsing.

**Repeat support:**  
Reminders can be one-shot or repeating. Repeating reminders with a finite count
decrement on each fire; infinite repeating reminders re-enqueue indefinitely until
explicitly stopped.

### Music Player — Shoukaku / Lavalink (`client.musicPlayer`, `client.musicQueue`)

The global music player exposes two properties on the discord.js `Client`:

| Property | Type | Description |
|---|---|---|
| `client.musicPlayer` | `Shoukaku` | Shoukaku instance managing all Lavalink connections |
| `client.musicQueue` | `Map<string, GuildMusicQueue>` | Per-guild ephemeral queue state (not persisted) |

`client.musicPlayer` is initialized in `PuppyBotClient._initMusic()` during
`login()`. A single Lavalink node (`Main`) is configured from the `LAVALINK_*`
environment variables. Shoukaku handles WebSocket reconnection, with
`reconnectTries: 2` and a `restTimeout` of 10 s.

`client.musicQueue` stores a `GuildMusicQueue` per active guild:

```ts
interface GuildMusicQueue {
  tracks: Track[];        // ordered; index 0 = current track
  voiceChannelId: string; // voice channel the bot occupies
  textChannelId: string;  // text channel for "now playing" embeds
  loop: boolean;          // whether to loop the current track
}
```

Track resolution is handled in `PlayCommand.resolve()`:

1. If the input matches `^https?://`, it is passed as-is to `node.rest.resolve()`.
2. Otherwise it is prefixed with `ytsearch:` and searched on YouTube via Lavalink.
3. Lavalink returns `loadType` of `track`, `playlist`, `search`, `empty`, or `error`.
4. All tracks from a playlist are enqueued in order; for a search result the first
   match is used.

Player event listeners are registered on the Shoukaku `Player` object the first
time a guild enqueues a track:

- `end` — shifts the queue; replays if `loop` is set; leaves voice if the queue is exhausted.
- `exception` — logs the error and cleans up the player and queue entry.

---

## Command Reference

### Admin commands

| Command | Description |
|---|---|
| `/add group-channel` | Creates (or reuses) a text channel and associated role for opt-in group discussion |
| `/set logging` | Designates an audit-log channel; toggles edit/deletion echoing for `MessageEchoManager` |
| `/set moderate` | Designates a moderation channel and/or moderation role (stored in `GulagConfig`) |
| `/set role-assign` | Designates the role-assignment channel for `RoleAssignmentManager` |
| `/set prefix` | Changes the guild's command prefix in `GuildSettings` |
| `/set announce` | Configures the leave-announcer output channel in `LeaveAnnouncerConfig` |
| `/emojiusage` | Scans the full message history and returns per-emoji usage statistics. Also a context-menu command on users (`Track Emoji Usage`). Aliases: `emoji-usage`, `emoji-count`, `emoji-stats` |

### Custom command management

| Command | Description |
|---|---|
| `/customcommand add <name> <output>` | Creates a new custom command in `CustomCommand` (DB + cache) |
| `/customcommand alias <name> <alias>` | Adds an alias to an existing command |
| `/customcommand remove <name>` | Deletes a custom command from the DB and cache |
| `/customcommand edit <name> <output>` | Changes the output of a custom command |
| `/customcommand rename <name> <new-name>` | Renames a command (updates DB and cache key) |
| `/customcommand list` | Lists all custom commands in a paginated embed |
| `/customcommand reset` | Removes all custom commands in the guild |
| `/customcommand info <name>` | Shows metadata: creator, creation date, use count, aliases |

Aliases: `cc`, `custom`, `custom-command`, `meme`.  
Custom commands are also invokable as prefix commands (e.g., `!mycommand`).

### Meme commands — Python-generated images

Python scripts in `src/scripts/` are called via `python-shell`.
Output image files are written to `saves/<name>/` and sent as Discord attachments.

| Command | Script | Description |
|---|---|---|
| `/correct <user>` | `bright.py` | Pastes a user's avatar into the "Bright slap" meme. Aliases: `bright`, `punch` |
| `/duwang [target]` | `duwang.py` | "What a beautiful Duwang" (JoJo's BA) panel; optional image URL or text. |
| `/sylphie [activity]` | `sylphie.py` | "The one thing I ever want to do" (Redo of Healer) meme with optional activity text. File: `Healing.ts`. |
| `/kinzo <user> <text>` | `kinzo.py` | Whining meme; stamps a user's avatar and text onto the Kinzo frame (Umineko). Also a context-menu command (`Meme - Kinzo Whining`). |
| `/liar <user> <text>` | `lied.py` | "Liar" meme; stamps a user's avatar and text onto the Lied frame (Elfen Lied). Also a context-menu command (`Meme - Liar`). |
| `/magneto <image>` | `magneto.py` | "Magneto — I've been thwarted again" meme using a provided image URL. |

### Meme commands — Random media

These commands pick a random file from `src/assets/media/<folder>/` and post it
as a Discord attachment. A `type` slash-command choice option is auto-populated
from the folder's filename mapping (capped at Discord's 25-choice limit).

| Command | Folder | Available types |
|---|---|---|
| `/omedetou [type]` | `congratulations/` | Bedman, Buu, Dio, Flonne, Evangelion, Genius, Godzilla, Sailors, Sengoku, Taiga. Aliases: `congratulations`, `congrats` |
| `/superturn [type]` | `superturn/` | Bernkastel, Chair, Chargeman Ken, Dark Souls, Huz, Izaya, Kotomine, Maika, Maki, RoboCop, Shirou, Speed Racer, Spinzaku, Touhou, Truck, Spinningbirdkick, Wheel of Fortune. Aliases: `super-turn`, `waiting` |

### Music

The invoker must be in a voice channel; the bot requires `Connect`, `Speak`, and
`RequestToSpeak` client permissions. Track resolution is proxied through Lavalink.
For non-URL input the bot uses `ytsearch:` (YouTube search). Direct URLs to
SoundCloud, Bandcamp, Twitch, Vimeo, and generic HTTP audio streams are also
supported by the Lavalink server.

| Command | Description |
|---|---|
| `/play <source>` | Resolves a YouTube URL/search query or direct audio URL and enqueues it. If nothing is playing, playback begins immediately; otherwise the track is appended to the per-guild queue. |
| `/pause` | Pauses the active Shoukaku player for the guild. |
| `/resume` | Resumes a paused player. |
| `/skip` | Advances the queue to the next track. |
| `/stop` | Stops playback, clears the queue, and disconnects from the voice channel. |
| `/seek <position>` | Seeks to a timestamp within the current track (e.g., `1:30`). |

### Reminders

| Command | Description |
|---|---|
| `/reminder create <when> <content> [mention] [location]` | Creates a reminder. `when` accepts duration strings (e.g., `in 2 hours`) or natural-language dates (e.g., `next Monday at 9am`). Optional `mention` targets a user or role; optional `location` specifies a channel. |
| `/reminder list` | Lists all your reminders in a paginated, interactive embed |

### RNG utilities

| Command | Aliases | Description |
|---|---|---|
| `/roll <notation>` | `dice` | Rolls dice using RPG notation (e.g., `3d6`, `4d8kh3`, `2d6!>=5`). Full [dice-roller](https://dice-roller.github.io/documentation/) syntax supported. |
| `/groups <size> <entries...>` | `teams`, `team`, `group` | Divides a space-separated list of entries into random teams of the given size. Supports re-roll button. |

### Battle system — Traps

| Command | Description |
|---|---|
| `/trap create <phrase>` | Plants a hidden trap; triggers when any user types the phrase in any channel |
| `/trap list mine` | Shows your armed traps and their statistics |
| `/trap list hidden` | Shows all obscured (active) traps in the guild (paginated) |
| `/trap disarm <id>` | Disarms one of your own traps |
| `/trap clear` | Clears all triggered / expired traps |

Trap damage formulae are configurable per guild via `BattleConfig`: `Base`, `Linear`, `Exponential`, or `Interval`.

### Utility

| Command | Description |
|---|---|
| `/ping` | Latency / heartbeat check |

---

## Base Command Classes

All commands ultimately extend one of three abstract base classes, which themselves
extend Sapphire's `Subcommand`.

```
Subcommand (Sapphire)
  └── PuppyBotCommand
        ├── PyScriptCommand
        │     └── (BrightCommand, DuwangCommand, SylphieCommand, KinzoCommand,
        │           LiedCommand, MagnetoCommand)
        └── RandomMediaCommand
              └── (CongratulationsCommand, SuperturnCommand)
```

### `PuppyBotCommand` (`src/lib/structures/command/PuppyBotCommand.ts`)

The root base class for every PuppyBot command.

- **Cooldowns** — default 10 s window, 2 uses per channel (scoped to `BucketScope.Channel`).
  Users in `CLIENT_OWNERS` are always exempt.
- **Dash-less aliases** — `generateDashLessAliases: true` automatically creates
  e.g., `customcommand` as an alias for `custom-command`.
- **ID hint maps** (`SLASH_ID_HINTS`, `CONTEXT_MENU_ID_HINTS`) — map each command
  name to its known Discord application-command IDs (production and development).
  Provided to Sapphire's `registerApplicationCommands` via `slashCommandOptions` /
  `contextCommandOptions` to prevent duplicate command creation on redeploy.
- **Guild-scoped registration** — if a command's `runIn` is limited to guilds, its
  slash commands are registered only in `DEV_GUILD_ID` during development, and
  globally in production.

### `PyScriptCommand` (`src/lib/structures/command/PyScriptCommand.ts`)

Wraps `python-shell`'s `PythonShell.run()` to invoke a Python script in
`src/scripts/` with optional string arguments. Returns the script's stdout lines
as a `string[]` (whitespace / CR stripped). Each concrete subclass specifies the
`scriptName` field via `@ApplyOptions`. The returned file paths are sent as
Discord attachment objects.

### `RandomMediaCommand` (`src/lib/structures/command/RandomMediaCommand.ts`)

On construction, reads `src/assets/media/<folder>/` and builds a `typeDict`
mapping filenames → human-readable descriptions. Registers a slash command with
a `type` string-choice option auto-populated from the type dict (capped at
Discord's 25-choice limit). On invocation, resolves the chosen type to a file
path (or picks randomly) and sends it as a Discord attachment.

---

## Scheduled Tasks

Scheduled tasks are Bull jobs registered via `@sapphire/plugin-scheduled-tasks`.
Task payload types are declared in `src/lib/types/augments.d.ts`. Bull connects
to Redis using the `REDIS_*` environment variables.

| Task name | File | Trigger | Description |
|---|---|---|---|
| `FireReminder` | `src/scheduled-tasks/reminders/FireReminder.ts` | Per-reminder Bull delayed job | Fires the reminder: resolves the target (DM, role ping, or channel message), sends it, logs a `Fire` `ReminderEvent` to MongoDB, and re-enqueues if the schedule is repeating. |
| `BattleSystem_RegenerateUsers` | `src/scheduled-tasks/battleSystem/RegenerateUsers.ts` | Repeating interval (`BATTLESYSTEM_INTERVAL_SECS`) | Loads all guilds, retrieves every `BattleUser` record, and regenerates HP and energy according to the level's configured `baseHealthRegen` / `baseEnergyRegen` rates. |

---

## Event Listeners

Listeners live in `src/listeners/` and are auto-discovered by Sapphire's store system.

### `client/ready/`

| File | Event | Description |
|---|---|---|
| `loadGuildData.ts` | `ClientReady` (once) | Iterates all cached guilds and calls `GuildCreateGuildInitialize.loadGuild()` for each |
| `loadGlobalSystems.ts` | `ClientReady` (once) | Instantiates the global `ReminderManager` and restores pending reminder Bull jobs |

### `client/guildCreate/`

| File | Description |
|---|---|
| `guildInitialize.ts` | Fires on `GuildCreate`. Runs the full per-guild initialization path (identical to the ready-listener path). Initialization steps are individually try/caught so a single failure does not abort the rest. |

### `client/guildMemberRemove/`

Fires `GuildLeaveAnnouncerManager` to post a configured farewell message when
a member leaves.

### `client/messageCreate/`

Two listeners fire on every `MessageCreate` event:

| File | Description |
|---|---|
| `checkForCustomCommands.ts` | Checks the message content against the guild's `CustomCommandSystem` cache. If the content matches a command name or alias, sends the stored response. |
| `checkForTraps.ts` | Checks the message content against all `Armed` `BattleTrap` records in the guild. Matching traps trigger `BattleSystem.triggerTrap()`. Messages beginning with the `disarm` prefix command are skipped to avoid immediate self-disarm conflicts. |

### `client/messageDelete/` and `client/messageUpdate/`

Forward content to `MessageEchoManager` when deletion or edit echoing is enabled
for the guild.

### `client/messageReactionAdd/`

Processed by `RoleAssignmentManager` to grant roles mapped to reaction-based
assignment messages.

### `client/BattleSystem/trapTrigger/` and `client/BattleSystem/trapDisarm/`

- `trapTrigger/` — handles the downstream effects of a trap trigger (posting the
  damage embed in the trap channel, updating stats, writing a `Trigger`
  `BattleTrapRecord` to MongoDB).
- `trapDisarm/` — handles the `/trap disarm` command's confirmation flow and writes
  a `Disarm` record.

### `client/GuildMessageScanner/`

Receives paginated message chunk events from `GuildMessageScanner` and dispatches
them to subscribed scanners (`EmojiUsageManager`, etc.).

### `client/interactionCreate/`

Handles button interactions for paginated embeds (reminder list, emoji usage
results, custom command list, etc.).

### `client/chatInputCommandDenied/`, `chatInputCommandError/`, `chatInputCommandFinish/`

Standard Sapphire command lifecycle hooks:
- `Denied` — sends a user-readable error embed when a precondition is not met.
- `Error` — reports unhandled command errors to Sentry (if configured) and sends a
  generic error embed.
- `Finish` — optional telemetry / usage logging.

### `client/messageCommandError/`

Same as `chatInputCommandError` but for prefix (message) commands.

### `error/`

Catches unhandled `Promise` rejections and uncaught exceptions at the process level,
forwarding them to Sentry.

### `scheduled-tasks/`

Lifecycle listeners for Bull jobs (e.g., `failed`, `completed`) used for
logging and error reporting.

---

## Data Model (Prisma / MongoDB)

Schema: `prisma/schema.prisma`. The datasource is MongoDB and Prisma generates a
typed client (via `@prisma/client`). The schema uses `@db.ObjectId` for all
auto-generated `_id` fields.

### Reminder system

| Model / Type | Description |
|---|---|
| `Reminder` | Top-level reminder record: `ownerId`, `target` (embedded `ReminderTarget`), `content`, `isDisabled`, relation to schedules and events |
| `ReminderTarget` | Embedded type: `type` (`User`/`Role`/`Channel`), `mentionableIds[]`, optional `channelId`, optional `guildId` |
| `ReminderSchedule` | Firing schedule: `reminderTime` (UTC), `repeat` (`ReminderRepeatSchedule`), `isDisabled` |
| `ReminderRepeatSchedule` | Embedded: `isRepeating`, optional `isInfinite`, optional `interval` (ms) |
| `ReminderEvent` | Append-only event log: `eventType` (`Create`/`Fire`/`Reschedule`/`Stop`/`Subscribe`/`Unsubscribe`), `location` (`DiscordLocation`), `payload` (JSON) |
| `DiscordLocation` | Embedded: `guildId?`, `channelId`, `messageId` |

### Battle system

| Model / Type | Description |
|---|---|
| `BattleConfig` | Versioned per-guild config: `levelConfigs` (array of `BattleLevelConfig`), `trapConfig` (`BattleTrapConfig`), `abilityConfigs` (array of `BattleAbilityConfig`). Unique on `[guildId, version]`. |
| `BattleLevelConfig` | Per-level embedded type: XP threshold, max HP/energy, trap slot count, base regen rates |
| `BattleTrapConfig` | Trap settings: icon URLs, channel ID, message TTL, damage config (`BattleTrapDamageConfig`) |
| `BattleTrapDamageConfig` | Formula type + scalars: `formulaType` (`Base`/`Linear`/`Exponential`/`Interval`), `numCharacterScalar`, `wordScalar`, `exponentialScalar?`, `linearScalar?`, `timeIntervals` (array of `BattleTrapConfigTimeIncremental`) |
| `BattleAbilityConfig` | Per-ability config: `type` (`Gulag`/`Trap`), `reqEnergy`, `reqExperience` |
| `BattleUser` | Player record: `userId`, `guildId`, `stats` (`BattleUserStats`), `info` (`BattleUserInfo`). Unique on `[userId, guildId]`. |
| `BattleUserStats` | Embedded: `experience`, `health`, `energy` (all Float) |
| `BattleTrap` | A trap phrase: `phrase`, `state` (`Armed`/`Fired`/`Disarmed`/`Removed`), linked to `BattleUser` |
| `BattleTrapRecord` | Immutable per-trap event: `type` (`Create`/`Trigger`/`Disarm`/`Remove`), `guildId`, `payload` (JSON) |

### Custom commands

| Model | Description |
|---|---|
| `CustomCommand` | Guild-scoped command: `guildId`, `name`, `aliases[]`, `ownerId`, `content`, `createdAt`, `lastUsedAt?`, `useCount` |

### Guild configuration

| Model | Description |
|---|---|
| `GuildSettings` | `guildId` (PK), optional `prefix`, `timezone`, `accountChannelId` |
| `RoleAssignConfig` | `guildId` (PK), optional `roleChannelId`, `fetchOnLoad` |
| `LeaveAnnouncerConfig` | `guildId` (PK), optional `outputChannelId`, `echoLeaves` |
| `MessageEchoConfig` | `guildId` (PK), optional `outputChannelId`, `echoDeletes`, `echoEdits` |
| `GulagConfig` | `guildId` (PK), optional `moderationChannelId`, `moderationRoleId`, `allowGulagUnmoderated` |

### Emoji usage

| Model / Type | Description |
|---|---|
| `GuildEmojiUsage` | `guildId` (PK), array of `EmojiRecord` |
| `EmojiRecord` | Embedded: `emojiId`, array of `EmojiUserRecord` |
| `EmojiUserRecord` | Embedded: `userId`, `messageCount`, `reactionCount` |
| `GuildScanRegistryRecord` | Tracks incremental scan progress: `guildId`, `channelId`, `type` (`EmojiUsage`/`RoleAssign`), `lastMessageScannedId?`. Unique on `[guildId, channelId, type]`. |

### Game scanner (schema retained, feature inactive)

The following models are present in the schema from a previous AWBW game scanner
feature. The scanner commands and scheduled tasks have been removed; the models
remain for potential future re-implementation.

| Model | Description |
|---|---|
| `GameScanConfig` | Per-guild scanner config: `gameType` (`AdvanceWarsByWeb`), optional `outputChannelId`. Unique on `[guildId, gameType]`. |
| `GameScanUserRecord` | Discord user ↔ in-game username mapping |
| `GameScanGameRecord` | A tracked game: `gameId`, `gameType`, `isActive` |
| `GameScanGuildRegisterGameRecord` | Junction: which guilds are watching which games. Unique on `[guildId, gameScanGameRecordId]`. |
| `GameScanEvent` | Immutable event log: `eventType` (`CurrentTurn`/`EndGame`), `gameId`, `payload` (JSON) |

### Moderation / misc

| Model | Description |
|---|---|
| `ModerationEvent` | Timestamped moderation action: `userId`, `moderatorId`, `roleIds[]`, `startTime`, `endTime?`, `active` |
| `Note` | User-authored key/value note: `authorId`, `guildId`, `key`, `full`, timestamps |
| `PathfinderSheetConfig` | Versioned Pathfinder character sheet layout config per guild |
| `PathfinderCharacterConfig` | A registered character: `sheetUrl`, `name`, `ownerId`, `lastUpdated` |

---

## Project Layout

```
puppy-bot/
├── lavalink/
│   ├── Lavalink.jar               # Lavalink audio server binary
│   ├── application.yml            # Lavalink server config (port, sources, filters, plugins)
│   └── plugins/                   # Lavalink plugin JARs (e.g., youtube-plugin)
├── prisma/
│   └── schema.prisma              # MongoDB schema (Prisma)
├── saves/                         # Python script image output directories (per meme)
│   ├── bright/
│   ├── duwang/
│   ├── kinzo/
│   ├── lied/
│   ├── magneto/
│   └── sylphie/
├── src/
│   ├── index.ts                   # Entry point: Sentry init, client creation, login
│   ├── deleteCommands.ts          # Utility script: bulk-delete slash commands
│   ├── importOldSchema.ts         # One-off migration script
│   ├── assets/
│   │   ├── fonts/                 # Fonts used by Python image scripts
│   │   └── media/                 # Static media for RandomMediaCommand subclasses
│   │       ├── congratulations/
│   │       ├── superturn/
│   │       └── ...
│   ├── commands/
│   │   ├── admin/                 # AddCommand, SetCommand, EmojiUsage
│   │   ├── custom/                # CustomCommand (multi-subcommand)
│   │   ├── memes/                 # Bright, Congratulations, Duwang, Healing(Sylphie),
│   │   │                          #   Kinzo, Lied, Magneto, Superturn
│   │   ├── music/                 # Play, Pause, Resume, Skip, Stop, Seek
│   │   ├── reminders/             # Reminder
│   │   ├── rng/                   # DiceRollCommand, GroupsCommand
│   │   └── traps/                 # Trap
│   ├── config/default/
│   │   └── BattleConfig.json      # Default battle system config (versioned)
│   ├── lib/
│   │   ├── env/
│   │   │   ├── schema.ts          # Zod schema: validates and parses all env vars at startup
│   │   │   ├── utils.ts           # Legacy envParse* helper wrappers (read from parsed env)
│   │   │   └── types.d.ts         # TypeScript env type declarations
│   │   ├── routes/                # Sapphire API plugin route handlers
│   │   ├── setup.ts               # Sapphire plugin registration + CLIENT_OPTIONS
│   │   ├── structures/
│   │   │   ├── builders/          # PuppyBotSlashCommandBuilder
│   │   │   ├── client/            # PuppyBotClient (Prisma + Shoukaku init, fetchPrefix)
│   │   │   ├── command/           # PuppyBotCommand, PyScriptCommand, RandomMediaCommand
│   │   │   ├── managers/          # All per-guild and global subsystem managers
│   │   │   │   ├── AGuildScannerRegistryOwner.ts
│   │   │   │   ├── BattleSystem.ts
│   │   │   │   ├── CustomCommandSystem.ts
│   │   │   │   ├── EmojiUsageManager.ts
│   │   │   │   ├── GuildLeaveAnnouncerManager.ts
│   │   │   │   ├── GuildMessageScanner.ts
│   │   │   │   ├── GuildMusicQueue.ts   ← per-guild queue state interface
│   │   │   │   ├── GuildSettingsManager.ts
│   │   │   │   ├── MessageEchoManager.ts
│   │   │   │   ├── ReminderManager.ts
│   │   │   │   └── RoleAssignmentManager.ts
│   │   │   ├── message/           # Embed and paginated-message helpers
│   │   │   └── types/
│   │   │       └── augments.d.ts  # discord.js module augmentations (Guild, Client props)
│   │   └── utils/                 # constants.ts, logging.ts, time.ts
│   ├── listeners/
│   │   ├── client/
│   │   │   ├── BattleSystem/
│   │   │   │   ├── trapTrigger/   # Trap trigger effect handling
│   │   │   │   └── trapDisarm/    # Trap disarm confirmation + record
│   │   │   ├── chatInputCommandDenied/
│   │   │   ├── chatInputCommandError/
│   │   │   ├── chatInputCommandFinish/
│   │   │   ├── guildCreate/       # Full per-guild initialization on join
│   │   │   ├── guildMemberRemove/ # Leave announcer trigger
│   │   │   ├── GuildMessageScanner/ # Scanner chunk event dispatch
│   │   │   ├── interactionCreate/ # Button/paginator interactions
│   │   │   ├── login/
│   │   │   ├── messageCommandError/
│   │   │   ├── messageCreate/     # Custom command + trap phrase checking
│   │   │   ├── messageDelete/     # MessageEchoManager (deletions)
│   │   │   ├── messageReactionAdd/ # RoleAssignmentManager
│   │   │   ├── messageUpdate/     # MessageEchoManager (edits)
│   │   │   └── ready/             # Guild data + global system startup
│   │   ├── error/             # Unhandled rejection / uncaught exception → Sentry
│   │   └── scheduled-tasks/   # Bull job lifecycle (failed, completed) logging
│   ├── preconditions/
│   │   └── OwnerOnly.ts           # Blocks non-owner users
│   ├── scheduled-tasks/
│   │   ├── battleSystem/          # RegenerateUsers — HP/energy regen tick
│   │   └── reminders/             # FireReminder — sends reminder and re-enqueues
│   └── scripts/               # Python meme-generation scripts
│       ├── bright.py
│       ├── duwang.py
│       ├── kinzo.py
│       ├── lied.py
│       ├── magneto.py
│       └── sylphie.py
└── tests/
    ├── setup.ts                   # Vitest global setup (mocks, env)
    ├── globals.d.ts
    ├── helpers/
    │   └── mocks.ts
    ├── unit/                      # Fast isolated unit tests (no I/O)
    │   ├── BattleSystem.formulas.test.ts
    │   ├── CustomCommandSystem.cache.test.ts
    │   ├── DiceRollCommand.test.ts
    │   ├── GroupsCommand.test.ts
    │   └── ReminderCommand.test.ts
    └── integration/               # Integration tests (Prisma + seeded MongoDB)
        ├── CustomCommandSystem.test.ts
        ├── GuildSettings.test.ts
        └── ReminderManager.test.ts
```
