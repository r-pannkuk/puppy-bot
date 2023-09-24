process.env.NODE_ENV ??= 'development';

import { config } from 'dotenv';

config.arguments;

import 'reflect-metadata'
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-api/register';
// import '@sapphire/plugin-hmr/register';
import '@sapphire/plugin-scheduled-tasks/register';
import type { ClientOptions } from 'discord.js';
import { Time } from '@sapphire/time-utilities';
import { BucketScope } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { envParseArray, envParseInteger, envParseString } from './env/utils';
import './utils/time'

export const CLIENT_OPTIONS: ClientOptions = {
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
        GatewayIntentBits.GuildVoiceStates,

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
        scope: BucketScope.Channel
    },
    // hmr: {
    //     enabled: process.env.NODE_ENV === 'development',
    //     usePolling: true,
    //     interval: Time.Second * 2,
    //     // silent: true
    // },
    tasks: {
        bull: {
            connection: {
                password: envParseString('REDIS_PASSWORD'),
                port: envParseInteger('REDIS_PORT'),
                host: envParseString('REDIS_URL'),
                db: envParseInteger('REDIS_DB'),
            }
        }
    },
    presence: {
        status: 'online',
        activities: [
            {
                name: "Woof!",
                type: ActivityType.Listening
            }
        ]
    }
}


declare module '@sapphire/plugin-scheduled-tasks' {
    interface ScheduledTasks {
        BattleSystem_RegenerateUsers: never;
        CheckGameStatus_AdvanceWarsByWeb: never;
        MusicPlayer_UpdateProgress: never;
        Reminder_FireReminder: never;
    }
}