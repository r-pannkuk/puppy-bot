import type { LeaveAnnouncerConfig } from "@prisma/client";
import { container } from "@sapphire/framework";
import type { Guild, GuildTextBasedChannel } from "discord.js";
import type { IConfigLoader } from "./IConfigLoader";
import type { IGuildManager } from "./IGuildManager";

export class GuildLeaveAnnouncerManager implements IGuildManager, IConfigLoader<LeaveAnnouncerConfig> {
	protected guildId: string;
	public get guild(): Guild | undefined {
		return container.client.guilds.cache.get(this.guildId);
	}

	protected _config: LeaveAnnouncerConfig | undefined = undefined;
	public get config() { return this._config; }
	public get echoLeaves() { return this._config?.echoLeaves ?? false; }
	public get outputChannel() {
		if (!this._config?.outputChannelId) return undefined;
		return this.guild?.channels.cache.get(this._config.outputChannelId) as GuildTextBasedChannel;
	}
	public constructor(guild: Guild) {
		this.guildId = guild.id;

		// (async () => {
		// 	await this.loadConfig();
		// })()
	}

	public async loadConfig() {
		var loadedConfig = await container.database.leaveAnnouncerConfig.findFirst({
			where: {
				guildId: {
					equals: this.guildId
				}
			}
		});

		if (!loadedConfig) {
			// Create new and save.
			loadedConfig = await container.database.leaveAnnouncerConfig.create({
				data: {
					guildId: this.guildId
				}
			})
		}

		this._config = loadedConfig;
	}

	public async setConfig(args: {
		outputChannelId?: string,
		echoDeletes?: boolean,
		echoEdits?: boolean,
	}) {
		var loadedConfig = await container.database.leaveAnnouncerConfig.update({
			where: {
				guildId: this.guildId,
			},
			data: args
		});

		this._config = loadedConfig;

		return loadedConfig;
	}
}