import {default as Discord } from 'discord.js';
import { default as commando } from 'discord.js-commando';
import {default as User } from './User.js';
import {default as BattleSystem } from './BattleSystem.js';

/**
 * @typedef {Object} StatisticRankConfig
 * @property {string} name - The human-readable name for this metric.
 * @property {number} percentage - The percentage value that this rank kicks in at. 
 */

/**
 * @callback StatisticMetricResolvable
 * @param {commando.CommandoGuild} guild - The guild for the user to collect data on.
 * @param {Discord.User|string|User} user - The user attempting to fetch the metric on.
 * @param {number} min - The minimum amount for this metric.
 * @param {number} max - The maximum amount for this metric.
 * @returns {number} The value of this metric represented as a percentage between maximum and minimum. 
 * 
 */

const bindMetricResolvable = (value, min, max) => {
    if (value < min) {
        value = min;
    }
    if (value > max) {
        value = max;
    }
    return value;
}


/**
 * @type {Object<string, StatisticMetricResolvable>}
 */
const MetricResolvable = {
    /** @type {StatisticMetricResolvable} */
    LEVEL: (guild, user) => {
        /** @type {BattleSystem} */
        var battleSystem = guild.battleSystem;
        var userObj = battleSystem.fetchUser(user);
        return bindMetricResolvable(value, min, max);
    },
    /** @type {StatisticMetricResolvable} */
    TRAP_DAMAGE: (guild, user) => {
        /** @type {BattleSystem} */
        var battleSystem = guild.battleSystem;
        var userObj = battleSystem.fetchUser(user);
        return bindMetricResolvable(value, min, max);
    },
    /** @type {StatisticMetricResolvable} */
    EMOJI_USAGE: (guild, user) => {
        /** @type {BattleSystem} */
        var battleSystem = guild.battleSystem;
        var userObj = battleSystem.fetchUser(user);
        return bindMetricResolvable(value, min, max);
    },
    /** @type {StatisticMetricResolvable} */
    AVG_POST_LENGTH: (guild, user) => {
        /** @type {BattleSystem} */
        var battleSystem = guild.battleSystem;
        var userObj = battleSystem.fetchUser(user);
        return bindMetricResolvable(value, min, max);
    },
    /** @type {StatisticMetricResolvable} */
    MENTIONS: (guild, user) => {
        /** @type {BattleSystem} */
        var battleSystem = guild.battleSystem;
        var userObj = battleSystem.fetchUser(user);
        return bindMetricResolvable(value, min, max);
    },
    /** @type {StatisticMetricResolvable} */
    ROLES: (guild, user, min, max) => {
        /** @type {Discord.GuildMemberRoleManager} */
        var roles = guild.members.cache.get(user.id || user).roles;
        return bindMetricResolvable(roles.cache.array.length, min, max);
    }
}



/** 
 * @typedef {Object} StatisticConfig 
 * @property {string} name - The name of the statistic used.
 * @property {string} metricResolvable - The algorithm used to compute this metric.
 * @property {StatisticRankConfig[]} ranks - A list of assigned classifications for this metric.
 * @property {number} min - The minimum amount for this rank.
 * @property {number} max - The maximum amount for this rank.
 */

/** Object containing all user relevant statistics. */
class CustomStatistic {
    /**
     * 
     * @param {StatisticConfig} config 
     */
    constructor(config, {
        _name
    }) {

    }
}

module.exports = CustomStatistic;