const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class VroomuCommands extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'vroomu',
            group: 'memes',
            memberName: 'vroomu',
            description: 'This is really dumb.',
            examples: ['!vroomu']
        });
    }

    async run(message) {
        message.channel.send({
            files: ['./commands/memes/media/vroomu/vroomu.png']
        });
    }
}
