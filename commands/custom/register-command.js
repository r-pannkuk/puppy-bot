const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomManager = require('../../core/custom/CustomManager.js');

module.exports = class RegisterCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'register-command',
            group: 'custom',
            memberName: 'register-command',
            description: 'Adds a custom meme command.',
            examples: ['!register-command newCommandName http://bit.ly/2DaER2o'],
            aliases: ['registercommand', 'newcommand', 'new-command', 'meme'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'commandName',
                    prompt: 'Please enter a command name to repeat this command with.',
                    type: 'string'
                },
                {
                    key: 'content',
                    prompt: "Please enter a source for the image or text to repeat.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {string} args.commandName
     * @param {string} args.content
     */
    async run(message, { commandName, content }) {
        var embeds = message.embeds.filter(i => {
            return i.type === 'image'
        });

        // Checking embeds for a valid image
        if (embeds.length > 0) {
            content = embeds[0].url;

        }

        // If not found, checking attachments instead
        else if (message.attachments.size > 0) {
            var attachments = message.attachments.entries();
            for (const [key, value] of attachments) {
                var url = value.url;
                //True if this url is a png image.
                if (url.match(/(.+)\.(jpeg|jpg|gif|png)(([\?\/].*)?)$/) !== null) {
                    content = url;
                    break;
                }
            }
        }

        else if (content.match(/(.+)\.(jpeg|jpg|gif|png)(([\?\/].*)?)$/) !== null) {
            // Valid image
        }

        /** @type {CustomManager} */
        var customManager = message.guild.customManager;

        var customCommandSchema = await customManager.addCustomCommand(commandName, message.author, content);

        if (customCommandSchema.error) {
            message.channel.send(customCommandSchema.error);
        } else {
            message.channel.send(`New command created under !${customCommandSchema.name}.`);
        }
    }
}
