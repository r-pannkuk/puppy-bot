import { fetch, FetchResultTypes, FetchMethods } from "@sapphire/fetch";
import { OAuth2Routes, RouteBases, Routes, APIApplicationCommand } from 'discord-api-types/v9';
import { stringify } from 'node:querystring';

import { SLASH_ID_HINTS, CONTEXT_MENU_ID_HINTS } from './lib/structures/command/PuppyBotCommand'

interface JsonAccessToken {
    access_token: string;
}

interface Credential {
    Name: string;
    ApplicationId: string;
    ApplicationSecret: string;
    globalCommands: string[];
    Guilds: [
        {
            id: string;
            commands: string[];
        }
    ]
}

// Dratini Credentials
const Credentials: Credential[] = [
    {
        Name: 'Puppy-Bot (Dev)',
        ApplicationId: '736371626643423312',
        ApplicationSecret: 'ysukGRkPqDeQwiwG5J84TqMX9EcL-vc8',
        globalCommands: [
        ],
        Guilds: [{
            id: "478122196812693504",
            commands: [
            ]
        }]
    },
    // {
    //     Name: 'Puppy-Bot',
    //     ApplicationId: '331669086813814784',
    //     ApplicationSecret: '',
    //     Commands: []
    // }
]

/**
 * Retrieves a client_credentials access token from the Discord OAUTH API
 * @returns {Promise<string>} The access token to be used
 */
async function getBearerToken(credential: Credential) {
    /** @type {import('discord-api-types/v9').RESTPostOAuth2ClientCredentialsResult} */
    const body = await fetch<JsonAccessToken>(
        OAuth2Routes.tokenURL,
        {
            headers: {
                Authorization: `Basic ${Buffer.from(`${credential.ApplicationId}:${credential.ApplicationSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stringify({
                grant_type: 'client_credentials',
                scope: 'applications.commands.update'
            }),
            method: FetchMethods.Post
        },
        FetchResultTypes.JSON
    );

    if (!body.access_token) throw new Error(`Failed to fetch access token. Raw body: "${JSON.stringify(body)}"`);

    return body.access_token;
}

async function getGlobalCommands(credential: Credential, token: string) {
    try {
        /** @type {import('discord-api-types/v9').APIApplicationCommand} */
        const body = await fetch<APIApplicationCommand[]>(
            `${RouteBases.api}${Routes.applicationCommands(credential.ApplicationId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                method: FetchMethods.Get
            },
            FetchResultTypes.JSON
        );

        return body.map((command) => command.id);
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getGuildCommands(credential: Credential, token: string, guildId: string) {
    try {
        /** @type {import('discord-api-types/v9').APIApplicationCommand} */
        const body = await fetch<APIApplicationCommand[]>(
            `${RouteBases.api}${Routes.applicationGuildCommands(credential.ApplicationId, guildId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                method: FetchMethods.Get
            },
            FetchResultTypes.JSON
        );

        return body.map((command) => command.id);
    } catch (error) {
        console.error(error);
        return [];
    }
}

/**
 * Deleted a command by its ID
 * @param {Object} credential The bot access credential.
 * @param {string} credential.ApplicationId The bot's application ID.
 * @param {string} credential.ApplicationSecret The bot's OAuth Secret.
 * @param {string} token The authentication token from Discord
 * @param {string} commandId The Command ID to remove
 */
async function deleteGuildCommand(credential: Credential, token: string, guildId: string, commandId: string) {
    try {
        /** @type {Array<import('discord-api-types/v9').APIApplicationCommand>} */
        await fetch(
            `${RouteBases.api}${Routes.applicationGuildCommand(credential.ApplicationId, guildId, commandId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                method: FetchMethods.Delete
            },
            FetchResultTypes.Result
        );

        console.log(`Deleted slash command ${commandId} successfully\n==============\n`);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Deleted a command by its ID
 * @param {Object} credential The bot access credential.
 * @param {string} credential.ApplicationId The bot's application ID.
 * @param {string} credential.ApplicationSecret The bot's OAuth Secret.
 * @param {string} token The authentication token from Discord
 * @param {string} commandId The Command ID to remove
 */
async function deleteCommand(credential: Credential, token: string, commandId: string) {
    try {
        /** @type {Array<import('discord-api-types/v9').APIApplicationCommand>} */
        await fetch(
            `${RouteBases.api}${Routes.applicationCommand(credential.ApplicationId, commandId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                method: FetchMethods.Delete
            },
            FetchResultTypes.Result
        );

        console.log(`Deleted slash command ${commandId} successfully\n==============\n`);
    } catch (error) {
        console.error(error);
    }
}

const Main = async () => {
    for (var i in Credentials) {
        const credential = Credentials[i];
        const token = await getBearerToken(credential);

        let commandIds: string[];

        for (var j in credential.Guilds) {
            const guild = credential.Guilds[j];
            commandIds = guild.commands;

            if (commandIds.length === 0) {
                const usedIds = Object.values(SLASH_ID_HINTS).concat(Object.values(CONTEXT_MENU_ID_HINTS));
                commandIds = (await getGuildCommands(credential, token, guild.id) ?? []).filter((value) => !usedIds.includes(value));
            }
            for (var k in commandIds) {
                deleteGuildCommand(credential, token, guild.id, commandIds[k])
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve(5);
                    }, 5000);
                })
            }
        }

        commandIds = credential.globalCommands;

        if (commandIds.length === 0) {
            const usedIds = Object.values(SLASH_ID_HINTS).concat(Object.values(CONTEXT_MENU_ID_HINTS));;
            commandIds = (await getGlobalCommands(credential, token) ?? []).filter((value) => !usedIds.includes(value))
        }

        for (var j in commandIds) {
            deleteCommand(credential, token, commandIds[j])
            await new Promise(resolve => {
                setTimeout(() => {
                    resolve(5);
                }, 5000);
            })
        }
    }

    console.log(`Finished.`);
}

Main().then()
