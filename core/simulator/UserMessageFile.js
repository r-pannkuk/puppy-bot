const Discord = require('discord.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const appDir = path.dirname(require.main.filename);

const FILE_TYPE = '.json'

/**
 * @typedef ChannelData
 * @property {string} _lastMessageId
 * @property {string} _lastMessageTimestamp
 * @property {string[]} _data
 */

class UserMessageFile {
    constructor({
        _user = null,
        _guild = null,
        _channelData = {}
    }) {
        /** @private @type {string} */
        this._user = _user;
        /** @private @type {string} */
        this._guild = _guild;
        /** @private @type {Object.<string, ChannelData>} */
        this._channelData = _channelData;
    }

    get user() { return this._user; }
    get guild() { return this._guild; }
    get channelData() { return this._channelData; }

    path(prefix) {
        return `${prefix}${this._guild}${path.sep}${this._user}${FILE_TYPE}`;
    }

    /**
     * Generates a path for a UserMessageFile based on the member and guild id's.
     * @param {Discord.GuildMember|UserMessageFile|Object|string} member 
     * @param {Discord.Guild|string} guild
     */
    static path(prefix, member, guild) {
        if (member instanceof Discord.GuildMember)
            return `${prefix}${member.guild.id}${path.sep}${member.id}${FILE_TYPE}`;

        if (member instanceof UserMessageFile || member._user !== undefined) {
            return `${prefix}${member._guild}${path.sep}${member._user}${FILE_TYPE}`;
        }
        return `${prefix}${guild.id || guild}${path.sep}${member.id || member}${FILE_TYPE}`;
    }

    /**
     * Creates a new UserMessageFile for the specific member and guild.
     * @param {string} directory
     * @param {Discord.GuildMember|UserMessageFile|Object|string} member 
     * @param {Discord.Guild|string} guild
     */
    static async create(directory, member, guild) {
        const path = this.path(directory, member, guild);
        try {
            var pathExists = await fs.promises.access(path);
            if (pathExists) {
                return { error: `UserMessageFile already exists at this location.` }
            }
        } catch (e) {
            if (member instanceof Discord.GuildMember) {
                guild = member.guild.id;
                member = member.id;
            } else if (member instanceof UserMessageFile || member._user !== undefined) {
                guild = member._guild;
                member = member._user;
            } else if (guild instanceof Discord.Guild) {
                guild = guild.id;
            }

            var umf = new UserMessageFile({
                _user: member,
                _guild: guild
            });

            umf.save(directory);

            return umf;
        }
    }

    /**
     * Loads a UserMessageFile from the specified path.
     * @param {string} path 
     */
    static async load(path) {
        try {
            var pathExists = await fs.promises.access(path);
            var file = await fs.promises.readFile(path);
            var data = JSON.parse(file);
            return new UserMessageFile(data);
        } catch (error) {
            return { error: error }
        }
    }

    /**
     * Saves the UserMessageFile with it's current data.
     * @param {string} directory 
     */
    async save(directory) {
        var data = JSON.stringify(this);

        if (data === undefined) {
            throw new Error(`Bad data attempt at saving.`);
        }

        await fs.promises.writeFile(this.path(directory), JSON.stringify(this));
    }

    /**
     * Adds data to the UserMessageFile.
     * @param {Discord.Message} message 
     */
    addData(message) {
        const channelId = message.channel.id;

        if (this._channelData[channelId] === undefined) {
            this._channelData[channelId] = {
                _data: [],
                _lastMessageId: null,
                _lastMessageTimestamp: null
            };
        }

        if (this._channelData[channelId][message.id]) {
            this._channelData[channelId][message.id] = message.content;
            return this._channelData[channelId][message.id];
        }

        this._channelData[channelId]._data.push(message.content);

        if (this._channelData[channelId]._lastMessageTimestamp < message.createdTimestamp) {
            this._channelData[channelId]._lastMessageId = message.id;
            this._channelData[channelId]._lastMessageTimestamp = message.createdTimestamp;
        }
    }
}

module.exports = UserMessageFile;