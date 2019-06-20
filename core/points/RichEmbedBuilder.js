const Discord = require('discord.js');

module.exports.new = function (betPool) {
    return new Discord.RichEmbed()
        .setColor('RED')
        .setAuthor(betPool.message().author, betPool.message().authorIcon)
        .setThumbnail(betPool.message().thumbnail)
        .setDescription(betPool.message().description)
        .setFooter(betPool.message().footer);
}