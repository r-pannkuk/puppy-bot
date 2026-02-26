/**
 * @file augments.d.ts
 * @description Central module augmentation file for PuppyBot.
 *
 * All `declare module` extensions to discord.js, Sapphire Framework, and other
 * third-party libraries are consolidated here.
 *
 * Any new manager or guild-attached system should be declared here rather
 * than in the file that initializes it.
 */

import type { PrismaClient } from '@prisma/client';
import type { Shoukaku } from 'shoukaku';
import type { GuildMusicQueue } from '../structures/managers/GuildMusicQueue';
import type { ReminderManager } from '../structures/managers/ReminderManager';
import type { GuildSettingsManager } from '../structures/managers/GuildSettingsManager';
import type { BattleSystem } from '../structures/managers/BattleSystem';
import type { CustomCommandSystem } from '../structures/managers/CustomCommandSystem';
import type { GuildMessageScanner } from '../structures/managers/GuildMessageScanner';
import type { EmojiUsageManager } from '../structures/managers/EmojiUsageManager';
import type { RoleAssignmentManager } from '../structures/managers/RoleAssignmentManager';
import type { MessageEchoManager } from '../structures/managers/MessageEchoManager';
import type { GuildLeaveAnnouncerManager } from '../structures/managers/GuildLeaveAnnouncerManager';

// ---------------------------------------------------------------------------
// Sapphire container
// ---------------------------------------------------------------------------
declare module '@sapphire/pieces' {
    interface Container {
        /** Prisma database client; connected in {@link PuppyBotClient.login}. */
        database: PrismaClient;
    }
}

// ---------------------------------------------------------------------------
// discord.js — Client and Guild augmentations
// ---------------------------------------------------------------------------
declare module 'discord.js' {
    interface Client {
        /**
         * Shoukaku Lavalink client for music playback.
         * Initialised in {@link PuppyBotClient.login} when LAVALINK_ENABLED is true.
         */
        musicPlayer: Shoukaku;

        /**
         * Per-guild music queue state.
         * Keyed by guild snowflake string; entries are created on first `/play`
         * and removed when the bot leaves the voice channel.
         */
        musicQueue: Map<string, GuildMusicQueue>;

        /**
         * Global reminder manager, populated once on {@link Events.ClientReady}.
         * Holds all reminders in-memory and acts as the coordination layer
         * between MongoDB (source of truth) and the Redis/Bull job queue.
         */
        reminders: ReminderManager;
    }

    interface Guild {
        /**
         * Per-guild settings (prefix, timezone, account channel, etc.).
         * Loaded from MongoDB on guild initialization.
         */
        settings: GuildSettingsManager;

        /**
         * Battle / trap system for this guild.
         * Manages user stats, experience, and trap placement mechanics.
         */
        battleSystem: BattleSystem;

        /**
         * Custom command registry for this guild.
         * Commands are stored in MongoDB and cached in-memory at startup.
         */
        customCommandSystem: CustomCommandSystem;

        /**
         * Message content scanner that coordinates sub-scanners
         * (emoji tracking, role-assign triggers, etc.).
         */
        scanner: GuildMessageScanner;

        /** Echoes deleted and edited messages to a configured output channel. */
        messageEchoer: MessageEchoManager;

        /** Announces member leaves to a configured output channel. */
        leaveAnnouncer: GuildLeaveAnnouncerManager;

        /** Tracks per-emoji, per-user usage statistics across the guild. */
        emojiUsage: EmojiUsageManager;

        /** Manages role self-assignment via message reactions. */
        roleAssigner: RoleAssignmentManager;
    }
}

// ---------------------------------------------------------------------------
// Sapphire scheduled-tasks plugin — registered task names
// ---------------------------------------------------------------------------
declare module '@sapphire/plugin-scheduled-tasks' {
    interface ScheduledTasks {
        /** Regenerates HP/energy for all BattleSystem users on a schedule. */
        BattleSystem_RegenerateUsers: never;
        /** Fires a scheduled reminder and notifies the target(s). */
        Reminder_FireReminder: never;
    }
}
