const commando = require('discord.js-commando');
const pyShell = require('python-shell');


module.exports = class MagnetoCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'magneto',
            group: 'memes',
            memberName: 'magneto',
            description: 'This is really dumb.',
            examples: ['!magneto http://bit.ly/2DaER2o'],
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
        var embeds = message.embeds.filter(i => {
            return i.type === 'image'
        });

        // Checking embeds for a valid image
        if (embeds.length > 0) {
            source = embeds[0].url;

        }

        // If not found, checking attachments instead
        else if (message.attachments.size > 0) {
            var attachments = message.attachments.entries();
            for (const [key, value] of attachments) {
                var url = value.url;
                //True if this url is a png image.
                if (url.match(/(.+)\.(jpeg|jpg|gif|png)(([\?\/].*)?)$/) !== null) {
                    source = url;
                    break;
                }
            }
        }

        else if (source.match(/(.+)\.(jpeg|jpg|gif|png)(([\?\/].*)?)$/) !== null) {
            // Valid image
        }

        // Otherwise assuming no image is present.
        else {
            message.channel.send("Image was not found.  Please enter a valid image.")
            return;
        }

        pyShell.run('magneto.py', {
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
