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

        this.commandGroupID = `custom-${this.guildSettings.guild.id}`;

        var client = this.guildSettings.client;
        var guild = this.guildSettings.guild;

        var commandGroups = client.registry.findGroups(this.commandGroupID, true);

        if(commandGroups.length > 0) {
            this.commandGroup = commandGroups[0];
        } else {
            client.registry.registerGroup(this.commandGroupID, `Custom commands for **${guild.name}**.`);
            this.commandGroup = client.registry.findGroups(this.commandGroupID, true)[0];
        }

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

        var commandSchema = new CustomCommandSchema({
            _name: commandName,
            _owner: owner,
            _content: content
        });

        var temp = this.settings;

        temp.commands[commandName] = commandSchema;

        this.settings = temp;

        var registeredCommand = await this.registerCustomCommand(commandSchema);

        return commandSchema;
    }


    async _setGuildCustomCommandsEnabled(target, enabled) {
        var client = this.guildSettings.client;
        var guild = this.guildSettings.guild;

        if(target instanceof commando.CommandoGuild) {
            target = target.id;
        }

        var targetCommandGroupID = client.guilds.cache.find(g => g.id = target).customManager.commandGroupID;

        for(var i in client.registry.commands) {
            /** @type {commando.Command} */
            var command = client.registry.commands[i];

            if(command.groupID === targetCommandGroupID) {
                command.setEnabledIn(guild, enabled);
            }
        }
    }

    
    /**
     * Enables guild custom commands from a specific server.
     * @param {commando.CommandoGuild|string|number} target 
     */
    async enableGuildCustomCommands(target) {
        this._setGuildCustomCommandsEnabled(target, true);
    }

    
    /**
     * Enables guild custom commands from a specific server.
     * @param {commando.CommandoGuild|string|number} target 
     */
    async disableGuildCustomCommands(target) {
        this._setGuildCustomCommandsEnabled(target, false);
    }


    /**
     * Registers a specified custom command.
     * @param {CustomCommandSchema} commandSchema
     * @returns {CustomCommand}
     */
    async registerCustomCommand(commandSchema) {
        /** @type {commando.CommandoClient} */
        var client = this.guildSettings.client;
        var guild = this.guildSettings.guild;
        var command = new CustomCommand(client, commandSchema, this.commandGroupID);

        await command.init();

        await client.registry.registerCommand(command);

        client.guilds.cache.forEach((g) => {
            command.setEnabledIn(g, false);
        })

        command.setEnabledIn(guild, true);

        return command;
    }

    /**
     * Registers all custom commands in the custom commands array.
     */
    async registerCustomCommands() {
        for (var i in this.commands) {
            var registeredCommand = await this.registerCustomCommand(this.commands[i]);
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