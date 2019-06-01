const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class Host extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'host',
            group: 'games',
            memberName: 'host',
            description: 'Host a game.',
            guildOnly: true,
            examples: [ '!host' ]
        });
    }

    
    async run(message) {
        message.channel.send(`That's not a valid command.  Please try \`!mhw-host\` instead, and make sure to let Native know.`);
    }
}