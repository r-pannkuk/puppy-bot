/**
 * @file setup.ts
 * @description Sapphire plugin registration and shared {@link CLIENT_OPTIONS}.
 *
 * This module must be imported before {@link PuppyBotClient} so that all
 * Sapphire plugins (logger, editable-commands, API, scheduled-tasks) are
 * registered into the framework before the client is constructed.
 *
 * `CLIENT_OPTIONS` is exported so that {@link PuppyBotClient} can pass it
 * directly to the `SapphireClient` super-constructor.
 */
process.env.NODE_ENV ??= 'development';

import 'reflect-metadata';
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-api/register';
import '@sapphire/plugin-scheduled-tasks/register';
import type { ClientOptions } from 'discord.js';
import { Time } from '@sapphire/time-utilities';
import { BucketScope } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { envParseArray, envParseInteger, envParseString } from './env/utils';
import { join } from 'path';
import './utils/time';

export const CLIENT_OPTIONS: ClientOptions = {
    // setup.ts compiles to dist/lib/setup.js; dist/lib/../ == dist/ which is
    // where commands/, listeners/, etc. live.
    baseUserDirectory: join(__dirname, '..'),
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    defaultPrefix: envParseString('CLIENT_PREFIX', '!'),
    caseInsensitiveCommands: true,
    caseInsensitivePrefixes: true,
    loadDefaultErrorListeners: true,
    loadMessageCommandListeners: true,
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.User,
    ],
    defaultCooldown: {
        delay: Time.Second * 10,
        limit: 10,
        filteredUsers: envParseArray('CLIENT_OWNERS', []),
        scope: BucketScope.Channel,
    },
    tasks: {
        bull: {
            connection: {
                password: envParseString('REDIS_PASSWORD'),
                port: envParseInteger('REDIS_PORT'),
                host: envParseString('REDIS_URL'),
                db: envParseInteger('REDIS_DB'),
                // Fail fast if Redis is unreachable instead of hanging forever.
                // connectTimeout: ms to wait for the initial TCP handshake.
                connectTimeout: 5_000,
                // enableOfflineQueue: false causes ioredis to immediately reject
                // any command issued while the connection is not yet ready, rather
                // than silently queuing it (which would hang the caller forever).
                enableOfflineQueue: false,
                // retryStrategy: return null to stop reconnecting after the
                // first failed attempt during startup.
                retryStrategy: (times: number) => times > 3 ? null : Math.min(times * 500, 2_000),
            },
        },
    },
    presence: {
        status: 'online',
        activities: [
            {
                name: 'Woof!',
                type: ActivityType.Listening,
            },
        ],
    },
};

// Scheduled task type declarations live in src/lib/types/augments.d.ts
