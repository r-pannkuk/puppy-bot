const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomManager = require('./CustomManager.js');
const CustomCommandSchema = require('./CustomCommandSchema.js');

module.exports = class CustomCommand extends commando.Command {
    /**
     * 
     * @param {commando.CommandoClient} client - The client in use.
     * @param {CustomCommandSchema} commandSchema - The command schema for this custom command.
     * @param {string} groupID - The identifier for the command group to add to.
     */
    constructor(client, commandSchema, groupID) {
        super(client, {
            name: commandSchema._name,
            group: groupID,
            memberName: commandSchema._name,
            examples: [`!${commandSchema._name}`],
            description: ``,
            hidden: true,
            argsPromptLimit: 0
        })

        this.commandSchema = commandSchema;
    }

    async init() {
        var owner = await this.client.users.fetch(this.commandSchema._owner);
        this.description = `Custom command created by ${owner}.`
    }

    async run(message) {
        /** @type {CustomManager} */
        var custom = message.guild.customManager;
        message.channel.send(this.commandSchema._content);

        var temp = custom.settings;

        temp.commands[this.name]._lastUsedDate = Date.now();
        temp.commands[this.name]._useCount += 1;
        
        custom.settings = temp;
    }
}