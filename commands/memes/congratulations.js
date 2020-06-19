const commando = require('discord.js-commando');
const pyShell = require('python-shell');
const fs = require('fs');


module.exports = class CongratulationsCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'congratulations',
            group: 'memes',
            aliases: ['congraturations', 'omedetou'],
            memberName: 'congratulations',
            description: 'This is really dumb.',
            examples: ['!congratulations']
        });
    }

    async run(message) {
        var directory = './commands/memes/media/congratulations/';

        var files = fs.readdirSync(directory);

        message.channel.send({
            files: [directory + files[Math.floor(Math.random() * files.length)]]
        });
    }
}
