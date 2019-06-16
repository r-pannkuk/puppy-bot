const Discord = require('discord.js');
const commando = require('discord.js-commando');

const Enmap = require('enmap');

/**
 * Uses an enmap with a SQLite backend to store settings with guilds
 * @extends {SettingProvider}
 */
module.exports = class EnmapProvider extends commando.SettingProvider {
    /**
	 * @external Enmap
	 * @see {@link https://www.npmjs.com/package/enmap}
	 */

	/**
	 * @param {string} dbName Filename for the provider
	 */
	constructor(dbName) {
		super();

        /**
         * @name _enmap An enmap to the database storing guild and global settings.
         * @type {Enmap}
         * @readonly
        */
		this._enmap = new Enmap({
			name: dbName,
			fetchAll: true,
			persistent: true,
			autoFetch: true
		});

        /**
         * @name listeners A map of listeneres for the client to apply
         * @type {Map}
         */
		this.listeners = new Map();
	}

	clear(guild) {
		return new Promise((resolve, reject) => {
			this._enmap.delete(guild.id);

			resolve();
		});
	}

	destroy() {
		return new Promise((resolve, reject) => {
			delete this._enmap;

			resolve();
		});
	}

	get(guild, key, defVal) {
		var val = this._enmap.get(guild.id)[key];

		if (val === undefined) {
			this.set(guild, key, defVal);
		}

		return val;
	}

	init(client) {
		this.client = client;

		return new Promise((resolve, reject) => {
			this.listeners
				.set('commandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix))
				.set('commandStatusChange', (guild, command, enabled) => this.set(guild, `cmd-${command.name}`, enabled))
				.set('groupStatusChange', (guild, group, enabled) => this.set(guild, `grp-${group.id}`, enabled))
				.set('commandRegister', command => {
					for (const [guild, settings] of this.settings) {
						if (guild !== 'global' && !client.guilds.has(guild)) continue;
						this.setupGuildCommand(client.guilds.get(guild), command, settings);
					}
				})
				.set('groupRegister', group => {
					for (const [guild, settings] of this.settings) {
						if (guild !== 'global' && !client.guilds.has(guild)) continue;
						this.setupGuildGroup(client.guilds.get(guild), group, settings);
					}
				});

			this.listeners.forEach((listener, event) => client.on(event, listener));

			resolve();
		});
	}

	remove(guild, key) {
		return new Promise((resolve, reject) => {
			var guildSettings = this._enmap.get(guild.id);

			if (!(key in guildSettings)) {
				resolve();
			}

			var val = guildSettings[key];

			delete guildSettings[key];

			this._enmap.set(guild.id, guildSettings);

			resolve(val);
		});
	}

	set(guild, key, val) {
		return new Promise((resolve, reject) => {
			var guildSettings = this._enmap.get(guild.id);

			guildSettings[key] = val;

			this._enmap.set(guild.id, guildSettings);

			resolve(val);
		});
	}

	static getGuildID(guild) {
		var id = this._enmap.get(guild.id);

		if (id === undefined) {
			throw new Error('Unable to find guild ID.');
		}

		return id;
	}

    /**
     * Creates a new guild or fetches data for one if exists
     * @param {Guild} guild 
     */
	initGuild(client, guild, callback) {
		this.client = client;

		if (!this._enmap.has(guild.id)) {
			this._enmap.set(guild.id, {});

			this.setupGuild(guild.id, {});
		}

		callback(this._enmap.get(guild.id));
	}

    /**
	 * Loads all settings for a guild
	 * @param {string} guild Guild ID to load the settings of (or 'global')
	 * @param {Object} settings Settings to load
	 * @private
	 */
	setupGuild(guild, settings) {
		if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
		guild = this.client.guilds.get(guild) || null;

		// Load the command prefix
		if (typeof settings.prefix !== 'undefined') {
			if (guild) guild._commandPrefix = settings.prefix;
			else this.client._commandPrefix = settings.prefix;
		}

		// Load all command/group statuses
		Object.values(this.client.registry.commands).forEach(command => this.setupGuildCommand(guild, command, settings));
		Object.values(this.client.registry.groups).forEach(group => this.setupGuildGroup(guild, group, settings));
	}

	/**
	 * Sets up a command's status in a guild from the guild's settings
	 * @param {?CommandoGuild} guild Guild to set the status in
	 * @param {Command} command Command to set the status of
	 * @param {Object} settings Settings of the guild
	 * @private
	 */
	setupGuildCommand(guild, command, settings) {
		if (typeof settings[`cmd-${command.name}`] === 'undefined') return;
		if (guild) {
			if (!guild._commandsEnabled) guild._commandsEnabled = {};
			guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`];
		} else {
			command._globalEnabled = settings[`cmd-${command.name}`];
		}
	}

	/**
	 * Sets up a command group's status in a guild from the guild's settings
	 * @param {?CommandoGuild} guild Guild to set the status in
	 * @param {CommandGroup} group Group to set the status of
	 * @param {Object} settings Settings of the guild
	 * @private
	 */
	setupGuildGroup(guild, group, settings) {
		if (typeof settings[`grp-${group.id}`] === 'undefined') return;
		if (guild) {
			if (!guild._groupsEnabled) guild._groupsEnabled = {};
			guild._groupsEnabled[group.id] = settings[`grp-${group.id}`];
		} else {
			group._globalEnabled = settings[`grp-${group.id}`];
		}
	}

	/**
	 * Updates a global setting on all other shards if using the {@link ShardingManager}.
	 * @param {string} key Key of the setting to update
	 * @param {*} val Value of the setting
	 * @private
	 */
	updateOtherShards(key, val) {
		if (!this.client.shard) return;
		key = JSON.stringify(key);
		val = typeof val !== 'undefined' ? JSON.stringify(val) : 'undefined';
		this.client.shard.broadcastEval(`
			if(this.shard.id !== ${this.client.shard.id} && this.provider && this.provider.settings) {
				let global = this.provider.settings.get('global');
				if(!global) {
					global = {};
					this.provider.settings.set('global', global);
				}
				global[${key}] = ${val};
			}
		`);
	}
}