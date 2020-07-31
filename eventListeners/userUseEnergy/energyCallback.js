const Discord = require('discord.js');
const commando = require('discord.js-commando');

const User = require('../../core/battle/User.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');
const UserStatistics = require('../../core/battle/UserStatistics.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');

/**
 * 
 * @param {Discord.Client} client 
 * @param {User} user The user consuming energy.
 * @param {number} amount The amount of energy consumed.
 * @param {Object} payload What data was sent along with the event.
 */
module.exports = function (client, 
    user, 
    amount, 
    payload) {
    // victim.send(MessageEmbedBuilder.death());
};