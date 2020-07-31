const Discord = require('discord.js');
const commando = require('discord.js-commando');

const User = require('../../core/battle/User.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');
const UserStatistics = require('../../core/battle/UserStatistics.js');

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.GuildMember} guildMember 
 * @param {User} userData
 * @param {UserStatistics} beforeStats
 */
module.exports = function (client, guildMember, userData, beforeStats) {
    if (!guildMember || guildMember.id === client.user.id) {
        return;
    }

    guildMember.send(MessageEmbedBuilder.levelUp(userData, beforeStats));
};