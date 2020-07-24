const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class TrapListCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'traplist',
            group: 'traps',
            memberName: 'traplist', 
            description: 'List all active traps.  Only usable by admin.',
            examples: [ '!traplist' ],
            guildOnly: true,
            ownerOnly: true
        });
    }

    
    async run(message) {
        if (!msg.guild.members.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }


        var traps = Object.values(message.guild.battleSystem.trapList());
        if(traps.length > 0) {
            var string = "";
            for(var i in traps) {
                string += `[${traps[i].phrase}],`;
            }
            string = string.substr(0, string.length - 1);
            message.author.send(string);
        }
        else {
            message.author.send("No traps found.");
        }
    }
}