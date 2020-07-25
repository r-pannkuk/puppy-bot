const Discord = require('discord.js');

module.exports = class GameManager {
    constructor(guildSettings) {
        this.guildSettings = guildSettings;

        if(this.guildSettings.get('games') === undefined) {
            this.guildSettings.set('games', {});
        }
    }

    get games() { return this.guildSettings.get('games', {}); }
    set games(obj) { this.guildSettings.set('games', obj); }

    /**
     * Gets a new field in the game manager for the given game.
     * @param {string} gameKey The game to look up
     * @param {string} fieldKey The field to look up
     */
    get(gameKey, userKey, fieldKey) {
        if(userKey instanceof Discord.User || userKey instanceof Discord.GuildMember) {
            userKey = userKey.id;
        }

        if(!(gameKey in this.games)) {
            this.initGame(gameKey);
        }

        if(userKey === null || userKey === undefined) {
            return this.games[gameKey][fieldKey];
        }
        
        if(!(userKey in this.games[gameKey])) {
            var games = this.games;
            games[gameKey][userKey] = {};
            this.games = games;
        }

        return this.games[gameKey][userKey][fieldKey];
    }

    /**
     * Gets all values from all users for a given gameKey and fieldKey.
     * @param {string} gameKey 
     * @param {string} fieldKey 
     */
    getAll(gameKey, fieldKey) {
        if(!(gameKey in this.games)) {
            this.initGame(gameKey);
        }

        return Object.entries(this.games[gameKey]).map( keyValue => {
            var obj = {
                "user": keyValue[0]
            };
            
            if(fieldKey in keyValue[1]) {
                obj[fieldKey] = keyValue[1][fieldKey];
            }

            return obj;
        }).filter((userFieldObj) => fieldKey in userFieldObj);
    }

    /**
     * Sets a value under an optional username for a given gameKey and Field.
     * @param {string} gameKey 
     * @param {string} userKey 
     * @param {string} fieldKey 
     * @param {string} fieldValue 
     */
    set(gameKey, userKey, fieldKey, fieldValue) {
        if(userKey instanceof Discord.User || userKey instanceof Discord.GuildMember) {
            userKey = userKey.id;
        }

        if(!(gameKey in this.games)) {
            this.initGame(gameKey);
        }

        var gameObj = this.games;

        if(userKey === null || userKey === undefined) {
            gameObj[gameKey][fieldKey] = fieldValue;
        } else {
            if(!(userKey in gameObj[gameKey])) {
                gameObj[gameKey][userKey] = {};
            }

            gameObj[gameKey][userKey][fieldKey] = fieldValue;
        }

        this.games = gameObj;
        
        return fieldValue;
    }

    /**
     * Deletes a value from a given user in the game manager.
     * @param {string} gameKey 
     * @param {string} userKey 
     * @param {string} fieldKey 
     */
    delete(gameKey, userKey, fieldKey) {
        if(userKey instanceof Discord.User || userKey instanceof Discord.GuildMember) {
            userKey = userKey.id;
        }

        if(!(gameKey in this.games)) {
            this.initGame(gameKey);
        }

        var gameObj = this.games;

        if(userKey === null || userKey === undefined) {
            delete gameObj[gameKey][fieldKey];
        } else {
            if(!(userKey in gameObj[gameKey])) {
                return;
            }

            delete gameObj[gameKey][userKey][fieldKey];
        }

        this.games = gameObj;
        
        return;
    }

    initGame(gameKey) {
        if(this.games[gameKey] === undefined) {
            var games = this.games;

            games[gameKey] = {};

            this.games = games;
        }

        return this.games;
    }
};