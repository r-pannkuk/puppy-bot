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
            examples: [ '!free-bread' ]
        });
    }

    
    async run(message, {type}) {
        message.channel.send(`:roll:`);
    }
}