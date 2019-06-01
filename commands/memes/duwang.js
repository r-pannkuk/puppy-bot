const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class DuwangCommands extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'duwang',
            group: 'memes',
            memberName: 'duwang',
            description: 'This is really dumb.',
            examples: ['!duwang', '!duwang http://bit.ly/2DaER2o'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'source',
                    prompt: "Please enter a duwang source.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });
    }

    async run(message, { source }) {
        pyShell.PythonShell.run('duwang.py', {
            mode: 'text',
            pythonPath: 'C:\\Users\\rpann\\AppData\\Local\\Programs\\Python\\Python37-32',
            // pythonPath: '/usr/bin/python3.5',
            pythonOptions: ['-u'],
            scriptPath: './commands/memes/scripts/',
            args: [ source ]
        }, function (err, results) {
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
