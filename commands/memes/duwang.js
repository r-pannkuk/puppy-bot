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
        // Detect if image exists and override with image if so
        if (message.attachments.size > 0) {
            var attachments = message.attachments.entries();
            for (const [key, value] of attachments) {
                var url = value.url;
                //True if this url is a png image.
                if(url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    source = url;
                    break;
                }
            }
        }

        pyShell.run('duwang.py', {
            mode: 'text',
            pythonOptions: ['-u'],
            pythonPath: 'python3',
            scriptPath: './commands/memes/scripts/',
            args: [source]
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
