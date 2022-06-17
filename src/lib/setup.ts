process.env.NODE_ENV ??= 'development';

import { config } from 'dotenv';

config.arguments;

import 'reflect-metadata'
import '@sapphire/plugin-logger/register';
import '@sapphire/plugin-editable-commands/register';
import '@sapphire/plugin-api/register';
// import '@sapphire/plugin-hmr/register';
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis';

import type { ClientOptions } from 'discord.js';
import { Time } from '@sapphire/time-utilities';
import { BucketScope } from '@sapphire/framework';
import { Constants } from 'discord.js';
import { envParseArray, envParseInteger, envParseString } from './env/utils';
import './utils/time'

export const CLIENT_OPTIONS: ClientOptions = {
    intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'GUILD_BANS',
        'GUILD_EMOJIS_AND_STICKERS',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGES',
        'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS'
    ],
    defaultPrefix: envParseString('CLIENT_PREFIX', '!'),
    caseInsensitiveCommands: true,
    caseInsensitivePrefixes: true,
    loadDefaultErrorListeners: true,
    loadMessageCommandListeners: true,
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
        strategy: new ScheduledTaskRedisStrategy({
            bull: {
                redis: {
                    password: envParseString('REDIS_PASSWORD'),
                    port: envParseInteger('REDIS_PORT'),
                    host: envParseString('REDIS_URL')
                }
            }
        })
    },
    presence: {
        status: 'online',
        activities: [
            {
                name: "Woof!",
                type: Constants.ActivityTypes.LISTENING
            }
        ]
    }
}