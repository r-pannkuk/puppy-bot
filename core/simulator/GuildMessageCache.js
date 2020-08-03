const Discord = require('discord.js');
const commando = require('discord.js-commando');
const fs = require('fs');
const os = require('os');
const path = require('path');
const appDir = path.dirname(require.main.filename);

const UserMessageFile = require('./UserMessageFile.js');

module.exports = class GuildMessageCache {
    /**
     * 
     * @param {object} guildSettings 
     * @param {commando.CommandoClient} guildSettings.client
     * @param {commando.CommandoGuild} guildSettings.guild 
     */
    constructor(guildSettings) {
        this.guildSettings = guildSettings;
        /** @private @type {Object<string, UserMessageFile>} */
        this.userMessageFiles = {};

        this.ready = false;

        this._directory = `${appDir}${path.sep}data${path.sep}`

        if (!fs.existsSync(this._directory)) {
            fs.mkdirSync(this._directory);
        }
    }

    get client() { return this.guildSettings.client; }
    get guild() { return this.guildSettings.guild; }

    /**
     * Initializes the UserMessageCache files by loading data. 
     */
    async init() {

        for (const [key, member] of this.guild.members.cache) {
            if (member.user.bot) {
                continue;
            }

            await this.fetchUserMessageFile(member);
        }

        this.ready = true;
        this.inUse = false;

        /** @private */
        this._messageCount = 0;
    }

    /**
     * Creates a new UserMessageFile or loads one for the specific member and guild.
     * @param {Discord.GuildMember|Discord.User|UserMessageFile|Object|string} member 
     */
    async fetchUserMessageFile(member) {
        if (member instanceof Discord.GuildMember || member instanceof Discord.User) {
            member = member.id;
        } else if (member instanceof UserMessageFile || typeof (member) === 'object') {
            member = member._user;
        }

        if (this.userMessageFiles[member]) {
            return this.userMessageFiles[member];
        }

        this.inUse = true;


        var directory = `${this._directory}${path.sep}${this.guild.id}${path.sep}`

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }

        var load = await UserMessageFile.load(UserMessageFile.path(this._directory, member, this.guild));

        if (load.error) {
            load = await UserMessageFile.create(this._directory, member, this.guild);
        }

        this.userMessageFiles[member] = load;
        this.inUse = false;

        return load;
    }

    async _fetchMessages(channel, seed) {
        var firstMessageID = seed;

        if (seed) {
            var token = 'after'
        } else {
            var token = 'before';
        }

        var settings = {
            limit: 100
        };

        do {
            settings[token] = firstMessageID;
            var messages = await channel.messages.fetch(settings);

            for (var [key, message] of messages) {
                var umf = await this.fetchUserMessageFile(message.author);

                umf.addData(message);

                this.userMessageFiles[umf.user] = umf;
            }

            this._messageCount += messages.size;

            var sorted = messages.sort((a, b) => {
                if (seed) {
                    return b.createdTimestamp - a.createdTimestamp
                } else {
                    return a.createdTimestamp - b.createdTimestamp
                }
            });

            if (sorted.size !== settings.limit) {
                break;
            } else {
                firstMessageID = messages.first().id;
            }

        } while (true)
    }

    _setInterval(timeout, callback) {
        this.inUse = true;
        this._messageCount = 0;
        var lastCount = 0;

        var timer = setInterval(() => {
            callback({
                finished: false
            }, this._messageCount);

            if (this._messageCount === lastCount) {
                this._clearInterval(timer, callback, `Message fetch stalled out.`);
            }

            lastCount = this._messageCount;
        }, timeout);

        return timer;
    }

    _clearInterval(timer, callback, error) {
        var statusObj = {
            finished: !error
        };

        if (error) {
            statusObj.error = error;
        }

        callback(statusObj, this._messageCount);
        clearInterval(timer);

        this.inUse = false;
        this._messageCount = 0;
    }

    async fetchAll(timeout, callback) {
        /** @type {Discord.TextChannel[]} */
        var channels = this.guild.channels.cache.filter(c => c.type === 'text');

        var timer = this._setInterval(timeout, callback);

        for (const [key, channel] of channels) {
            // Get the maximum lastMessageTimestamp across all UMD's
            var firstMessageID = null;

            var sortedUMD = Object.values(this.userMessageFiles)
                .filter(umd => umd.channelData[key] !== undefined)
                .map(umd => umd.channelData[key])
                .sort((a, b) =>
                    b._lastMessageTimestamp - a._lastMessageTimestamp
                );

            if (sortedUMD.length > 0) {
                firstMessageID = sortedUMD[0]._lastMessageId;
                await this._fetchMessages(channel, firstMessageID);
            } else {
                await this._fetchMessages(channel);
            }
        }

        var umds = Object.values(this.userMessageFiles);

        for (var umd of umds) {
            umd.save(this._directory);
        }

        this._clearInterval(timer, callback);
    }
}