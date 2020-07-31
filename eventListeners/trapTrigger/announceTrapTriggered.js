const Discord = require('discord.js');
const commando = require('discord.js-commando');

const User = require('../../core/battle/User.js');
const Trap = require('../../core/battle/Trap.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');
const UserStatistics = require('../../core/battle/UserStatistics.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const Admin = require('../../core/Admin.js');

/**
 * @listens trapTriggered
 * @param {Discord.Client} client The client object.
 * @param {Discord.Message} message The message that triggered the trap.
 * @param {Trap} trap Trap that triggered.
 * @param {User} victim The player who triggered the trap.
 * @param {User} attacker Who initiated the trap.
 */
module.exports = function (client,
    trap,
    message,
    victim,
    attacker) {
    if (trap !== undefined) {

        var embed = MessageEmbedBuilder.trapTriggered(trap, message, victim);

        message.channel.send(embed);

        /** @type {Admin} */
        var admin = message.guild.admin;
        var trapChannelID = admin.trapChannelID;

        /** Send to the trap channel if applicable. */
        if (trapChannelID !== null) {
            var channel = message.client.channels.cache.get(trapChannelID);
            channel.send(embed).catch((error) => console.log(error));
        }
    }
};