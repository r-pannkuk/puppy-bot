const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Scheduler = require('node-schedule');

const Moderation = require('./Moderation.js');

class ModerationSystem {
    /**
     * 
     * @param {object} guildSettings 
     * @param {commando.CommandoClient} guildSettings.client
     * @param {commando.CommandoGuild} guildSettings.guild 
     */
    constructor(guildSettings) {
        if (guildSettings.get('moderation') === undefined) {
            console.log('Moderation object not found, creating.');
            guildSettings.set('moderation', {});
        }

        this.guildSettings = guildSettings;
    }

    /** @type {Object.<string, Moderation>} A container of moderations. */
    get moderations() { return this.guildSettings.get('moderation'); }
    set moderations(obj) { this.guildSettings.set('moderation', obj); }

    /**
     * Updates a user by adding and removing specific role ID's.
     * @param {string} userID User ID to affect.
     * @param {string[]} rolesAdded List of role ID's to add.
     * @param {string[]} rolesRemoved List of role ID's to remove.
     */
    async _changeUserRoles(userID, rolesAdded, rolesRemoved) {
        var guild = this.guildSettings.guild;

        /** @type {Discord.GuildMember} */
        var member = guild.members.cache.get(userID);
        if (rolesRemoved && rolesRemoved.length > 0) {
            await member.roles.remove(rolesRemoved);
        }
        if (rolesAdded && rolesAdded.length > 0) {
            await member.roles.add(rolesAdded);
        }
    }

    /**
     * Schedules a user to be unmoderated
     * @param {Moderation} moderation 
     */
    async scheduleUnmoderation(moderation) {
        if (moderation._id in Scheduler.scheduledJobs) {
            var action = Scheduler.rescheduleJob;
        } else {
            var action = Scheduler.scheduleJob;
        }

        action(moderation._id, moderation._endTime, this.unmoderateUser.bind(this, moderation));
    }

    /**
     * Schedules and fires all moderations that have passed.  Used on start up.
     */
    scheduleAllModerations() {
        for (var i in this.moderations) {
            /** @type {Moderation} */
            var mod = this.moderations[i];

            if (mod._active) {
                if (Date.now() >= new Date(mod._endTime)) {
                    this.unmoderateUser(mod);
                } else {
                    this.scheduleUnmoderation(mod);
                }
            }
        }
    }

    /**
     * Creates a new moderation for a user with the specified settings.
     * @param {Moderation} moderationPayload - The information about the moderation.
     */
    moderateUser(moderationPayload) {
        var moderations = this.moderations;
        var activeModeration = this.getUserModerations(moderationPayload._userId);

        if (activeModeration) {
            moderationPayload._roles = [...new Set(moderationPayload._roles.concat(activeModeration._roles))];
            moderationPayload._startTime = activeModeration._startTime;
            moderationPayload._active = true;
            moderationPayload._id = activeModeration._id;
        }

        var mod = new Moderation(moderationPayload);

        if(this.guildSettings.guild.admin.moderationRoleID) {
            this._changeUserRoles(mod._userId, [this.guildSettings.guild.admin.moderationRoleID].filter(r => r !== null), mod._roles);
        } else {
            this._changeUserRoles(mod._userId, [], mod._roles);
        }

        this.scheduleUnmoderation(mod);

        /** @type {Discord.Guild} */
        var guild = this.guildSettings.guild;
        var member = guild.members.cache.get(mod._userId);
        var moderator = guild.members.cache.get(mod._moderatorId);

        member.send(`You have been moderated in **${guild.name}** by ${moderator} until ${mod._endTime}.`);

        moderations[mod._id] = mod;

        this.moderations = moderations;

        return mod;
    }

    /**
     * Unmoderatesa user, restoring them to their role status prior to the moderating.
     * @param {(Discord.User|Discord.GuildMember|string|Moderation)} user User ID of the user to unmoderate.
     */
    unmoderateUser(user) {
        if (user instanceof Discord.User || user instanceof Discord.GuildMember) {
            user = user.id;
        } else if ('_id' in user) {
            user = user._userId;
        }

        var moderations = this.moderations;
        var activeModeration = this.getUserModerations(user);

        // Serialize Moderation
        var mod = new Moderation(activeModeration);

        mod._active = false;
        mod._lastEditedTime = Date.now();
        mod._endTime = Date.now();

        this._changeUserRoles(mod._userId, mod._roles, [this.guildSettings.guild.admin.moderationRoleID].filter(r => r !== null));

        Scheduler.cancelJob(mod._id);

        /** @type {Discord.Guild} */
        var guild = this.guildSettings.guild;
        var member = guild.members.cache.get(user);
        member.send(`Your moderation has been lifted in ${guild.name}`);

        moderations[mod._id] = mod;

        this.moderations = moderations;

        return mod;
    }

    /**
     * Finds an active moderation for a user if any.
     * @param {(Discord.User|Discord.GuildMember|string|Moderation)} user User ID of the user to unmoderate.
     */
    getUserModerations(user) {
        if (user instanceof Moderation) {
            user = user._userId;
        } else if (user instanceof Discord.User || user instanceof Discord.GuildMember) {
            user = user.id;
        }
        return Object.values(this.moderations).filter(m => m._userId === user && m._active === true)[0];
    }
}


module.exports = ModerationSystem;