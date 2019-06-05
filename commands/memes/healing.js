const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class DuwangCommands extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'healing',
            group: 'memes',
            aliases: ['healing', 'sylphie'],
            memberName: 'healing',
            description: 'This is really dumb.',
            examples: ['!healing', '!healing program'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'action',
                    prompt: "Please enter a thing you want to do and only want to do.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });
    }

    async run(message, { action }) {
        pyShell.run('sylphie.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: './commands/memes/scripts/',
            args: [ source ]
        }, function (err, results) {
            console.log(err);
            // Trim white space and carriage return from the call
            if(results === undefined) {
                results = [];
            }
            results = results.map((value) => value.replace(/\s+/g, ''));
            message.channel.send({
                files: results
            });
        });
    }
}
