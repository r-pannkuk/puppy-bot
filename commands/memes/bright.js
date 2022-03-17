const commando = require('discord.js-commando');
let {PythonShell} = require('python-shell');


module.exports = class BrightCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'correct',
            group: 'memes',
            aliases: ['correct', 'bright'],
            memberName: 'bright',
            description: 'This is really dumb.',
            examples: ['!correct @Dog', '!bright @Dog'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'target',
                    prompt: "Please enter a target for correction.",
                    type: 'user',
                    infinte: true
                }
            ]
        });
    }

    async run(message, { target }) {
        PythonShell.run('bright.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: './commands/memes/scripts/',
            args: [target.displayAvatarURL()]
        }, function (err, results) {
            console.log(err);
            // Trim white space and carriage return from the call
            if (results === undefined) {
                results = [];
            }
            results = results.map((value) => value.replace(/\s+/g, ''));
            message.channel.send({
                files: results
            });
        });
    }
}
