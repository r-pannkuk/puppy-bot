import { default as got } from 'got';
import { default as jsdom } from 'jsdom';
import { default as Discord } from 'discord.js';
import { default as Scheduler } from 'node-schedule'
const { JSDOM } = jsdom;

import { default as GameKeys } from './GameKeys.js';

/**
 * @typedef {string} DiscordID
 * @typedef {string} AWBWUserId
 * @typedef {string} AWBWGameId
 */

/**
 * @typedef {Object} AWBWGame
 * @property {AWBWGameId} id
 * @property {string} name
 * @property {string} currentUser
 * @property {datetime} lastUpdated
 * @property {boolean} isFinished
 */

/**
 * @typedef {Object} AWBWSettings
 * @property {Record.<DiscordID, AWBWUserId>} users
 * @property {Record.<AWBWGameId, AWBWGame} games
 * @property {number} interval
 * @property {string} outputChannelID
 */

export default class AdvanceWarsByWeb {
    constructor(guildSettings) {
        if (guildSettings.get(GameKeys.AWBW) === undefined) {
            console.log("AWBW settings not found, creating.");
            guildSettings.set(GameKeys.AWBW, {});
        }

        this._guildSettings = guildSettings;

        var settings = this._guildSettings.get(GameKeys.AWBW);

        if (settings.users === undefined) {
            settings.users = {};
        }

        if (settings.games === undefined) {
            settings.games = {};
        }

        if (settings.interval === undefined) {
            settings.interval = 60 * 4;
        }

        if (settings.outputChannelId === undefined) {
            settings.outputChannelId = null;
        }

        this._guildSettings.set(GameKeys.AWBW, settings);

        this.checkGames();

        Scheduler.scheduleJob("Check-AWBW", "*/30 * * * * *", () => this.checkGames());
    }

    /** @type {AWBWSettings} */
    get settings() { return this._guildSettings.get(GameKeys.AWBW); }
    set settings(obj) { return this._guildSettings.set(GameKeys.AWBW, obj); }

    get users() { return this.settings.users; }
    set users(obj) { var settings = this.settings; settings.users = obj; this.settings = settings; }

    get games() { return this.settings.games; }
    set games(obj) { var settings = this.settings; settings.games = obj; this.settings = settings; }

    get interval() { return this.settings.interval; }
    set interval(obj) { var settings = this.settings; settings.interval = obj; this.settings = settings; }

    get outputChannelID() { return this.settings.outputChannelID; }
    set outputChannelID(obj) { var settings = this.settings; settings.outputChannelID = obj; this.settings = settings; }

    addUser(discordUserId, userID) {
        var users = this.users;
        users[discordUserId] = userID;
        this.users = users;
    }

    addUsers(recordList) {
        for (var i in recordList) {
            this.addUser(recordList[i].discord, recordList[i].awbw);
        }
    }

    removeUser(userId) {
        var users = this.users;
        if(userId in users) {
            delete users[userId];
            this.users = users;
            return userId;
        }
        return null;
    }

    removeUsers(userIdList) {
        var returned = [];
        for (var i in userIdList) {
            var removed = this.removeUser(userIdList[i])
            if(removed) {
                returned.push(removed);
            }
        }
        return returned;
    }

    removeDiscordUserId(discordUserId) {
        var users = this.users;
        var userId = Object.keys(users).find(id => users[id] === discordUserId);
        if(userId in users) {
            delete users[userId];
            this.users = users;
            return discordUserId;
        }
        return null;
    }

    removeDiscordUsers(userIdList) {
        var returned = [];
        for (var i in userIdList) {
            var removed = this.removeDiscordUserId(userIdList[i])
            if(removed) {
                returned.push(removed);
            }
        }
        return returned;
    }

    addGame(gameId) {
        // TODO: Checking if game already exists.
        // TODO: Getting game names
        var games = this.games;
        games[gameId] = {
            "id": gameId,
            "name": "",
            "currentUser": null,
            "lastUpdated": Date.now(),
            "isFinished": false
        }
        this.games = games;
    }

    addGames(gameList) {
        for (var i in gameList) {
            this.addGame(gameList[i]);
        }
    }

    removeGame(gameId) {
        var games = this.games;
        if(gameId in games) {
            delete games[gameId];
            this.games = games;
            return gameId;
        }
        return null;
    }

    removeGames(gameList) {
        var returned = [];
        for (var i in gameList) {
            var removed = this.removeGame(gameList[i]);
            if(removed) {
                returned.push(removed);
            }
        }
        return returned;
    }

    getGameList() {
        return "To be implemented.";
    }

    async notify(discordUserId, gameId) {
        console.log(`Notifying user ${discordUserId}.`);
        if (this.outputChannelID) {
            /** @type {Discord.Guild} */
            var guild = this._guildSettings.guild;

            /** @type {Discord.TextChannel} */
            var channel = guild.channels.cache.get(this.outputChannelID);

            /** @type {Discord.User} */
            var user = guild.members.cache.get(discordUserId);

            await channel.send(`It's ${user}'s turn in AWBW game ${gameId}.`);
        }
    }

    async checkGame(gameId) {
        const url = `https://awbw.amarriner.com/game.php?games_id=${gameId}`
        got(url).then(async response => {
            const dom = new JSDOM(response.body);
            const document = dom.window.document;
            var elements = document.getElementsByClassName('norm bold');
            var name = undefined
            for (var i in elements) {
                name = elements[i].title || name
            }

            if (name === undefined) {
                return
            }

            /** @type {AWBWGame} */
            var games = this.games;

            if (games[gameId].currentUser !== name) {
                var discordUserId = Object.keys(this.users).filter(u => this.users[u] === name)[0];

                if (discordUserId !== undefined) {
                    await this.notify(discordUserId, gameId);
                }

                games[gameId].currentUser = name;
            }

            games[gameId].lastUpdated = Date.now();

            this.games = games;


        }).catch(err => {
            console.log(`ERROR: ${err}`);
        });
    }

    checkGames() {
        for (var i in this.games) {
            this.checkGame(this.games[i].id);
        }
    }
}