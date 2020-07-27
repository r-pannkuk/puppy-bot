const Discord = require('discord.js');
const BattleSystem = require('../../core/battle/BattleSystem');

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

    /** @type {BattleSystem} */
    var battleSystem = message.guild.battleSystem;
    var content = message.content.toLowerCase();

    var validTraps = Object.values(battleSystem.traps).filter(t => {
        return content.indexOf(t.phrase.toLowerCase()) > -1 && t.messageId !== message.id
    });
    
    for (i in validTraps) {
        var validKey = validTraps[i].phrase;

        if (content === `!disarmtrap ${validKey}` || content === `!removetrap ${validKey}`) {
            continue;
        }

        battleSystem.springTrap(message, validTraps[i]);
    }
};