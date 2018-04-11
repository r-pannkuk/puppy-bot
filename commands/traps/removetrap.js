const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class RemoveTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'removetrap',
            group: 'traps',
            memberName: 'removetrap',
            description: 'Removes the last trap set by the command sender, or attempts to remove a trap phrase.',
            examples: [ '!removetrap', '!removetrap test' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to disarm.  It will probably work.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    
    async run(message, { phrase }) {
        if(!phrase) {
            var traps = Object.values(this.client.battleSystem.trapList());
    
            var trap = traps.find(t => t.ownerId === message.author.id);
    
            if(trap !== undefined) {
                this.client.battleSystem.removeTrap(trap.phrase);

                message.channel.send('Trap removed succesfully.');
            }
            else {
                message.channel.send('You haven\'t set a trap yet.');
            }
        }
        else {
            var traps = this.client.battleSystem.trapList();
            var sanitizedPhrase = phrase.toLowerCase();

            if(Object.keys(traps).indexOf(sanitizedPhrase) > -1) {
                var trap = this.client.battleSystem.removeTrap(sanitizedPhrase);

                var owner = this.client.users.get(trap.ownerId);
    
                message.channel.send(`You removed ${owner}\'s trap!`);
            }
            else {
                message.channel.send('Trap not found.');
            }
        }
    }
}