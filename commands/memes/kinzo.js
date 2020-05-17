const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class KinzoCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'kinzo',
            group: 'memes',
            aliases: ['kinzo', 'whine'],
            memberName: 'kinzo',
            description: 'This is really dumb.',
            examples: ['!kinzo', '!kinzo @Dog What a horrible thought', '!kinzo https://discordapp.com/channels/478122196812693504/478122196812693506/708536816470458389'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a user who whines.",
                    type: 'user',
                    default: ''
                },
                {
                    key: 'whine',
                    prompt: "Please whine about something.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });
    }

    async run(message, { user, whine }) {
        pyShell.run('kinzo.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: './commands/memes/scripts/',
            args: [ user.username, whine ]
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
