const Discord = require('discord.js');

/**
 * 
 * @param {Discord.Client} client 
 * @param {Discord.Message} message 
 */
module.exports = function (client, message) {
    if (message.channel.type !== 'text') {
        return;
    }

    if (message.author === client.user) {
        return;
    }

    if(message.author.bot) {
        return;
    }

    var content = message.content.toLowerCase();
    var traps = message.guild.battleSystem.traps;

    var validTraps = Object.values(traps).filter(t => {
        return content.indexOf(t.phrase.toLowerCase()) > -1 && t.messageId !== message.id
    });
    var validKeys = validTraps.reduce((p, t) => { p.push(t.phrase); return p; }, []);

    for (i in validKeys) {
        var validKey = validKeys[i];

        if (content === `!disarmtrap ${validKey}` || content === `!removetrap ${validKey}`) {
            return;
        }

        client.emit('sprungTrap', { message: message, key: validKey });

        message.guild.battleSystem.springTrap(message, validKey);
    }
};