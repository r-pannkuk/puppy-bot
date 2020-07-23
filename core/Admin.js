const Discord = require('discord.js');

/** Represents the Admin object for channel administration. */
class Admin {
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

        guildSettings.set('admin', settings);
    }

    get settings() { return this.guildSettings.get('admin'); }
    set settings(settings) { this.guildSettings.set('admin', settings); }

    get deleteChannelID() { return this.settings.deleteChannelID; }
    get trapChannelID() { return this.settings.trapChannelID; }
    get roleChannelID() { return this.settings.roleChannelID; }
    get accountChannelID() { return this.settings.accountChannelID; }
    get moderationChannelID() { return this.settings.moderationChannelID; }
    get moderationRoleID() { return this.settings.moderationRoleID; }

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

    addNewChannel(guild, channelName, categoryName, overwrites, callback) {
        guild.createChannel(channelName, 'text', overwrites)
            .then((channel) => {
                var categories = guild.channels.filter(c => c.type === 'category');

                var channelCategory = categories.find(c => c.name.toUpperCase() === categoryName.toUpperCase());

                var setChannelParentCallback = (parent) => {
                    channel.setParent(parent)
                        .then(callback);
                }

                if (channelCategory === null) {
                    guild.createChannel(categoryName, 'category')
                        .then(setChannelParentCallback);
                } else {
                    setChannelParentCallback(channelCategory);
                }
            });
    }

    createRole(guild, roleName, callback) {
        guild.createRole({
            name: roleName,
            color: 'DEFAULT',
            permissions: Discord.Permissions.DEFAULT,
            mentionable: true
        }).then(callback);
    }

    addRole(user, role, reason, callback) {
        user.addRole(role, reason)
            .then(callback);
    }

    removeRole(user, role, reason, callback) {
        user.removeRole(role, reason)
            .then(callback);
    }
}

module.exports = Admin;