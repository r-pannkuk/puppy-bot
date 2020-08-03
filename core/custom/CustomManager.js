const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomCommandSchema = require('./CustomCommandSchema.js');
const CustomCommand = require('./CustomCommand.js');

/**
 * @typedef CustomCommand
 * @property {string} name
 * @property {string} content
 * @property {string} 
 */

/**
 * @typedef {Object} CustomSettings 
 * @property {Object.<string, CustomCommandSchema>} commands
 */

/** Represents the Custom object for custom commands and other custom settings. */
class CustomManager {
    /**
     * 
     * @param {object} guildSettings 
     * @param {commando.CommandoClient} guildSettings.client
     * @param {commando.CommandoGuild} guildSettings.guild 
     */
    constructor(guildSettings) {
        if (guildSettings.get('custom') === undefined) {
            console.log("Custom settings not found, creating.");
            guildSettings.set('custom', {
            });
        }

        this.guildSettings = guildSettings;

        var settings = guildSettings.get('custom');

        if (settings.commands === undefined) {
            settings.commands = {};
        }

        guildSettings.set('custom', settings);
    }

    /** @type {CustomSettings} */
    get settings() { return this.guildSettings.get('custom'); }
    set settings(settings) { this.guildSettings.set('custom', settings); }

    get commands() { return this.settings.commands; }

    /**
     * 
     * @param {string} commandName 
     * @param {Discord.User | Discord.GuildMember | string} owner 
     * @param {string} content 
     */
    async addCustomCommand(commandName, owner, content) {
        /** @type {Discord.Guild} */
        var guild = this.guildSettings.guild;
        /** @type {commando.CommandoClient} */
        var client = this.guildSettings.client;

        if (owner instanceof Discord.User || owner instanceof Discord.GuildMember) {
            owner = owner.id;
        }

        commandName = commandName.toLowerCase();

        var existingCommands = client.registry.commands;

        if (existingCommands.map(c => c.name).find(v => v.toLowerCase() === commandName)) {
            return { error: `Custom command was already found for \`${commandName}\`.` };
        }

        var command = new CustomCommandSchema({
            _name: commandName,
            _owner: owner,
            _content: content
        });

        var temp = this.settings;

        temp.commands[commandName] = command;

        this.settings = temp;

        await this.registerCustomCommand(command);

        return command;
    }

    /**
     * Registers a specified custom command.
     * @param {CustomCommandSchema} commandSchema
     */
    async registerCustomCommand(commandSchema) {
        /** @type {commando.CommandoClient} */
        var client = this.guildSettings.client;
        var command = new CustomCommand(client, commandSchema);

        await command.init();

        await client.registry.registerCommand(command);
    }

    /**
     * Registers all custom commands in the custom commands array.
     */
    async registerCustomCommands() {
        for (var i in this.commands) {
            await this.registerCustomCommand(this.commands[i]);
        }
    }

    /**
     * 
     * @param {CustomCommandSchema|CustomCommand|string} command 
     */
    async unregisterCustomCommand(command) {
        /** @type {commando.CommandoClient} */
        var client = this.guildSettings.client;
        var temp = this.settings;

        if (command instanceof CustomCommandSchema || command._name !== null) {
            command = command._name;
        } else if (command instanceof CustomCommand) {
            command = command.name;
        }

        command = command.toLowerCase();

        if (!temp.commands[command]) {
            return { error: `Custom command \`${command}\` was not found.` }
        }

        command = client.registry.commands.get(command);

        client.registry.unregisterCommand(command);

        delete temp.commands[command.name];

        this.settings = temp;
    }
}

module.exports = CustomManager;