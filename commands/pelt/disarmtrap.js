const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class DisarmTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'disarmtrap',
            group: 'pelt',
            memberName: 'disarmtrap',
            description: 'Attempt to disarm a trap before it goes off.  Has a 99% chance of working.  Probably.',
            examples: [ '!disarmtrap test' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to disarm.  It will probably work.",
                    type: 'string'
                }
            ]
        });
    }

    
    async run(message, { phrase }) {
        var traps = this.client.battleSystem.trapList();
        var sanitizedPhrase = phrase.toLowerCase();

        if(Object.keys(traps).indexOf(sanitizedPhrase) > -1) {
            this.client.battleSystem.removeTrap(sanitizedPhrase);

            message.channel.send('Trap removed succesfully.');
        }
        else {
            message.channel.send('Trap not found.');
        }
    }
}