const Discord = require('discord.js');

/**
 * @typedef {Object} AdminSettings 
 * @property {string} deleteChannelID
 * @property {string} trapChannelID
 * @property {string} roleChannelID
 * @property {string} accountChannelID
 * @property {string} moderationChannelID
 * @property {string} moderationRoleID
 * @property {boolean} allowGulagUnmoderated
 */

/** Represents the Admin object for channel administration. */
class Admin {
    /**
     * 
     * @param {object} guildSettings 
     * @param {commando.CommandoClient} guildSettings.client
     * @param {commando.CommandoGuild} guildSettings.guild 
     */
    constructor(guildSettings) {
        if (guildSettings.get('admin') === undefined) {
            console.log("Admin settings not found, creating.");
            guildSettings.set('admin', {
                deleteChannelID: null,
                trapChannelID: null,
                roleChannelID: null
            });
        }

        this.guildSettings = guildSettings;

        var settings = guildSettings.get('admin');

        if (settings.deleteChannelID === undefined) {
            settings.deleteChannelID = null;
        }
        if (settings.trapChannelID === undefined) {
            settings.trapChannelID = null;
        }
        if (settings.roleChannelID === undefined) {
            settings.roleChannelID = null;
        }
        if (settings.accountChannelID === undefined) {
            settings.accountChannelID = null;
        }
        if (settings.moderationChannelID === undefined) {
            settings.moderationChannelID = null;
        }
        if (settings.moderationRoleID === undefined) {
            settings.moderationRoleID = null;
        }
        if (settings.allowGulagUnmoderated === undefined) {
            settings.allowGulagUnmoderated = false;
        }

        guildSettings.set('admin', settings);
    }

    /** @type {AdminSettings} */
    get settings() { return this.guildSettings.get('admin'); }
    set settings(settings) { this.guildSettings.set('admin', settings); }

    get deleteChannelID() { return this.settings.deleteChannelID; }
    get trapChannelID() { return this.settings.trapChannelID; }
    get roleChannelID() { return this.settings.roleChannelID; }
    get accountChannelID() { return this.settings.accountChannelID; }
    get moderationChannelID() { return this.settings.moderationChannelID; }
    get moderationRoleID() { return this.settings.moderationRoleID; }
    get allowGulagUnmoderated() { return this.settings.allowGulagUnmoderated; }

    set deleteChannelID(channelID) {
        var newSettings = this.settings;
        newSettings.deleteChannelID = channelID;
        this.settings = newSettings;
    }
    set trapChannelID(channelID) {
        var newSettings = this.settings;
        newSettings.trapChannelID = channelID;
        this.settings = newSettings;
    }
    set roleChannelID(channelID) {
        var newSettings = this.settings;
        newSettings.roleChannelID = channelID;
        this.settings = newSettings;
    }
    set accountChannelID(channelID) {
        var newSettings = this.settings;
        newSettings.accountChannelID = channelID;
        this.settings = newSettings;
    }
    set moderationChannelID(channelID) {
        var newSettings = this.settings;
        newSettings.moderationChannelID = channelID;
        this.settings = newSettings;
    }
    set moderationRoleID(roleID) {
        var newSettings = this.settings;
        newSettings.moderationRoleID = roleID;
        this.settings = newSettings;
    }
    set allowGulagUnmoderated(b) {
        var newSettings = this.settings;
        newSettings.allowGulagUnmoderated = b;
        this.settings = newSettings;
    }

    /**
     * 
     * @callback NewChannelCallback
     * @param {Discord.Channel} channel
     */

    /**
     * Creates a new channel under the specified category.
     * @param {string} channelName 
     * @param {string} categoryName 
     * @param {boolean} overwrites 
     * @param {NewChannelCallback} callback
     */
    async addNewChannel(channelName, categoryName, overwrites, callback) {
        var guild = this.guildSettings.guild;
        var categories = guild.channels.cache.filter(c => c.type === 'category');
        var channelCategory = categories.find(c => c.name.toUpperCase() === categoryName.toUpperCase());

        if (!channelCategory) {
            channelCategory = await guild.channels.create(categoryName, { type: 'category' });
        }

        return await guild.channels.create(channelName, { 
            type: 'text', 
            permissionOverwrites: overwrites, 
            parent: channelCategory
        });
    }

    /**
     * Creates a new role with the specified
     * @param {string} roleName 
     * @param {Function.<Discord.Role>} callback 
     */
    async createRole(roleName) {
        return await this.guildSettings.guild.roles.create({
            data: {
                name: roleName,
                color: 'DEFAULT',
                permissions: Discord.Permissions.DEFAULT,
                mentionable: true
            }
        });
    }
}

module.exports = Admin;