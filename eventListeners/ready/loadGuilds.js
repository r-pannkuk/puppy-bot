const Discord = require('discord.js');
const commando = require('discord.js-commando');

const guildInitialize = require('../guildCreate/guildInitialize.js')

/**
 * 
 * @param {Discord.Client} client 
 */
module.exports = function (client) {
    client.guilds.cache.forEach(async guild => {
        guildInitialize(client, guild);

        guild.channels.cache.filter(c => c.type === 'text').forEach(c => c.messages.fetch({limit:100}, true));
    });
};