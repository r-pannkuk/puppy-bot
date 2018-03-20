const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class RemoveTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'removetrap',
            group: 'pelt',
            memberName: 'removetrap',
            description: 'Removes the last trap set by the command sender.',
            examples: [ '!removetrap test' ],
            argsPromptLimit: 0,
            guildOnly: true
        });
    }

    
    async run(message) {
        var traps = Object.values(this.client.battleSystem.trapList());

        var trap = traps.find(t => t.owner.id === message.author.id);

        if(trap !== undefined) {
            this.client.battleSystem.removeTrap(trap.phrase);

            message.channel.send('Trap removed succesfully.');
        }
        else {
            message.channel.send('You haven\'t set a trap yet.');
        }
    }
}