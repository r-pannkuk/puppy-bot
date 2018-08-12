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
            ownerOnly: true
        });
    }

    
    async run(message) {
        if(!this.client.isOwner(message.author)) {
            return;
        }

        var traps = Object.keys(message.guild.battleSystem.trapList());
        if(traps.length > 0) {
            var string = "";
            for(var i in traps) {
                string += `[${traps[i]}],`;
            }
            string = string.substr(0, string.length - 1);
            message.channel.send(string);
        }
        else {
            message.channel.send("No traps found.");
        }
    }
}