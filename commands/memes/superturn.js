const commando = require('discord.js-commando');
const pyShell = require('python-shell');
const fs = require('fs');


module.exports = class SuperturnCommands extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'superturn',
            group: 'memes',
            memberName: 'superturn',
            description: 'This is really dumb.',
            examples: ['!superturn']
        });
    }

    async run(message) {
        var directory = './commands/memes/templates/superturn/';

        var files = fs.readdirSync(directory);

        message.channel.send({
            files: [directory + files[Math.floor(Math.random() * files.length)]]
        });
    }
}
