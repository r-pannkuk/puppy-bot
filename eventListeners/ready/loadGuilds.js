const guildInitialize = require('../guildCreate/guildInitialize.js')

module.exports = function (client) {
    client.guilds.forEach(guild => {
        guildInitialize(client, guild);

        if (guild.admin.roleChannelID !== null) {
            client.channels.find(c => c.id === guild.admin.roleChannelID).fetchMessages();
        }
    });
};

