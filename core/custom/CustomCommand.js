const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomCommandSchema = require('./CustomCommandSchema.js');

module.exports = class CustomCommand extends commando.Command {
    /**
     * 
     * @param {commando.CommandoClient} client 
     * @param {CustomCommandSchema} commandSchema 
     */
    constructor(client, commandSchema) {
        super(client, {
            name: commandSchema._name,
            group: 'memes',
            description: ``,
            memberName: commandSchema._name,
            examples: [`!${commandSchema._name}`],
            argsPromptLimit: 0
        })

        this.commandSchema = commandSchema;
    }

    async init() {
        var owner = await this.client.users.fetch(this.commandSchema._owner);
        this.description = `Custom command created by ${owner}.`
    }

    async run(message) {
        message.channel.send(this.commandSchema._content);
    }
}