const commando = require('discord.js-commando');
const Discord = require('discord.js');

const GameKeys = require('../../../core/games/GameKeys.js');


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
            examples: [ '!free-bread' ]
        });
    }

    
    async run(message) {
        // message.channel.send(`${message.guild.emojis.cache.get('522930879853625429')}`);
    }
}