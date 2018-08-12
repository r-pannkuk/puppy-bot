const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class AdminTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'admintrap',
            group: 'traps',
            memberName: 'admintrap',
            description: 'Admin tool for adding traps with a custom timestamp.',
            examples: [ '!admintrap <phrase> <userId> <timestamp>' ],
            argsPromptLimit: 0,
            ownerOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to trap on.  The longer the trap goes unsprung, the more damage it will do.",
                    type: 'string',
                },
                {
                    key: 'ownerId',
                    prompt: "Enter the owner's id for the trap.",
                    type: 'string'
                },
                {
                    key: 'date',
                    prompt: "Enter the timestamp for the trap.",
                    type: 'string',
                    validator: (val, msg, arg) => {
                        console.log(val);
                        regex = /^\\s*(201[0-9]\\W([0]?[0-9]|1[012])\\W([012]?[0-9]|3[01]))?\\s?(([01]?[0-9]|2[0-3])\\W([0-5][0-9])(\\W([0-5][0-9]))?(\\s*[AaPp][Mm])?)?\\s*$/;
                        regex.test(val);
                    },
                    parser: (val, msg, arg) => {
                        console.log(val);
                        return Date.parse(val);
                    }
                }
            ]
        });
    }

    
    async run(msg, { phrase, ownerId, date }) {
        if(!this.client.isOwner(msg.author)) {
            return;
        }

        var traps = message.guild.battleSystem._enmap.get('traps');

        var key = phrase.toLowerCase();

        if(Object.keys(traps).indexOf(key) > -1) {
            msg.channel.send('Trap was already found.');
            return false;
        }

        var status = message.guild.battleSystem.retrieve(ownerId);

        if('trapActive' in status && status.trapActive) {
            msg.channel.send('User already has a trap set.');
            return false;
        }

        traps[key] = message.guild.battleSystem.generateTrap(
            key, 
            ownerId, 
            Date.parse(date), 
            message.guild.battleSystem.defaultTrapCallback.bind(message.guild.battleSystem), 
            msg);

        status.trapActive = true;

        message.guild.battleSystem.set(ownerId, status);
        
        message.guild.battleSystem._enmap.set('traps', traps);

        msg.channel.send("Trap set succesfully.");
    }
}