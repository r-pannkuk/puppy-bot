const commando = require('discord.js-commando');
const Discord = require('discord.js');
const pyShell = require('python-shell');
const path = require('path');


module.exports = class DuwangCommands extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'duwang',
            group: 'memes',
            memberName: 'duwang',
            description: 'This is really dumb.',
            examples: [ '!duwang', '!duwang http://bit.ly/2DaER2o'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'source',
                    prompt: "Please enter a duwang source.",
                    type: 'string',
                    validate: input => {
                        return /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g.test(input);
                    },
                    default: ''
                }
            ]
        });
    }

    async run(message, { source }) {
        if(source === '') {
            message.channel.send({
                files: [
                    './commands/memes/duwang_original.jpg'
                ]
            });
        } else {
            pyShell.run('duwang.py', {
                mode: 'text',
                pythonOptions: ['-u'],
                scriptPath: './commands/memes/',
                args: [ source ]
            }, function(err, results) {
                message.channel.send({
                    files: [
                        './commands/memes/saves/test.png'
                    ]
                });
            });
        }
    }
}
