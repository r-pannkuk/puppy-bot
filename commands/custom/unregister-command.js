const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomManager = require('../../core/custom/CustomManager.js');
const CustomCommandSchema = require('../../core/custom/CustomCommandSchema.js');

module.exports = class UnregisterCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'unregister-command',
            group: 'custom',
            memberName: 'unregister-command',
            description: 'Adds a custom meme command.',
            examples: ['!unregister-command newCommandName'],
            aliases: ['unregistercommand', 'unmeme'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'commandName',
                    prompt: 'Please enter a command name to repeat this command with.',
                    type: 'string'
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {string} args.commandName
     */
    async run(message, { commandName }) {
        /** @type { CustomManager } */
        var customManager = message.guild.customManager;

        var customCommandSchema = customManager.commands[commandName];

        if(!customCommandSchema) {
            message.channel.send(`Custom command \`${commandName}\` was not found.`);
        }

        var owner = message.guild.members.resolve(customCommandSchema._owner);

        if (!message.guild.members.cache.get(message.author.id).hasPermission('ADMINISTRATOR') &&
            message.author.id !== owner.id) {
            message.channel.send(`You don't have permission to use that command.`);
            return;
        }

        customManager.unregisterCustomCommand(customCommandSchema);

        message.channel.send(`Removed ${owner}'s command \`${customCommandSchema._name}\`.`);
    }
}
