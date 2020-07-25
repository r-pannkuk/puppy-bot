const Discord = require('discord.js');
const commando = require('discord.js-commando');

const User = require('../../core/battle/User.js');
const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js');
const UserStatistics = require('../../core/battle/UserStatistics.js');

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.GuildMember} victim 
 * @param {User} victimBattleData 
 * @param {Discord.GuildMember} attacker 
 * @param {User} attackerBattleData 
 * @param {number} amount 
 */
module.exports = function (client, 
    victim, 
    victimBattleData, 
    attacker, 
    attackerBattleData, 
    amount) {
    if (!victim || attacker || victim.id === client.user.id) {
        return;
    }

    // victim.send(RichEmbedBuilder.death());
};