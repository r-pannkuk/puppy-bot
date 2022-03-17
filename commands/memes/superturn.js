const commando = require('discord.js-commando');
let {PythonShell} = require('python-shell');
const fs = require('fs');
const path = require('path');


module.exports = class SuperturnCommands extends commando.Command {
    constructor(client) {
        var directory = './commands/memes/media/superturn/';

        var files = fs.readdirSync(directory);
        var options = {}

        var description = `This is really dumb. Options: `

        for(var i in files) {
            var name = path.parse(files[i]).name
            options[name] = directory + files[i];
            description += `${name}, `
        }

        description = description.slice(0, description.length - 2)

        super(client, {
            name: 'superturn',
            group: 'memes',
            memberName: 'superturn',
            description: description,
            examples: ['!superturn', `!superturn ${Object.keys(options)[0]}`],
            args: [
                {
                    key: 'choice',
                    prompt: "Select a specific image to use from the list.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });

        this.directory = directory;
        this.options = options;
    }

    async run(message, { choice }) {
        var keys = Object.keys(this.options)
        if(choice === '') {
            choice = keys[Math.floor(Math.random() * keys.length)];
        } else {
            choice = choice.toLowerCase();

            if(keys.indexOf(choice) === -1) {
                message.channel.send(`Could not find the file specified.  Please choose from the list: ${keys.join(', ')}`)
                return;
            }
        }

        message.channel.send({
            files: [this.options[choice]]
        });
    }
}
