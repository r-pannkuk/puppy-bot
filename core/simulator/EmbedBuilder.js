const Discord = require('discord.js');

/**
 * 
 * @param {Discord.GuildMember} target 
 * @param {string} messageText 
 */
module.exports.generatedMessage = function (target, messageText) {
    return new Discord.MessageEmbed()
        .setAuthor(target.displayName, target.user.avatarURL())
        .setDescription(`\`${messageText}\``)
        .setFooter(`Generated using GPT-2.`);
}