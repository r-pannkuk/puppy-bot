const commando = require('discord.js-commando');
const Discord = require('discord.js');

const GameKeys = require('../GameKeys.js');


module.exports = class FreeBreadCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'free-bread',
            aliases: [
                'fb'
            ],
            group: 'games',
            memberName: 'free-bread',
            description: 'Free rolls for everyone!',
            examples: [ '!free-bread' ],
            args: [
                {
                    key: 'type',
                    prompt: 'What type of bread to have.',
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    
    async run(message, {type}) {
        type = type.toLowerCase();
        
        if(type === '') {
            type = 'm';
        }

        if(type === 'husbando' || type === 'h' ||
            type === 'waifu' || type === 'w' ||
            type === 'husbandog' || type === 'hg' ||
            type === 'waifug' || type === 'wg' ||
            type === 'marry' || type === 'm' ||
            type === 'marryg' || type === 'mg') {
            message.channel.send(`$${type}`);
        }
        else {
            message.channel.send(`Invalid format. Please omit or use one of the following:
-- husbando (h)
-- waifu (w)
-- marry (m)
-- husbandog (hg)
-- waifug (wg)
-- marryg (mg)`);
        }

    }
}