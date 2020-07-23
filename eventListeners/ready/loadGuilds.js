const guildInitialize = require('../guildCreate/guildInitialize.js')

module.exports = function(client) {
    client.guilds.forEach(guild => {
        guildInitialize(client, guild);

        guild.channels.filter(c => c.type === 'text').forEach(c => c.fetchMessages());

        /* Updating moderations. */
        guild.moderation.scheduleAllModerations();
    });
};