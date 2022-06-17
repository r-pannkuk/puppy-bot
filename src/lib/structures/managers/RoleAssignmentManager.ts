import { GuildScanRegistryType, RoleAssignConfig } from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import type { Guild, GuildTextBasedChannel, Message, MessageReaction, Role, User } from "discord.js";
import { Emojis } from "../../utils/constants";
import { AGuildScannerRegistryOwner } from "./AGuildScannerRegistryOwner";
import type { IConfigLoader } from "./IConfigLoader";
import type { IGuildManager } from "./IGuildManager";

export class RoleAssignmentManager extends AGuildScannerRegistryOwner<typeof GuildScanRegistryType.RoleAssign> implements IGuildManager, IConfigLoader<RoleAssignConfig> {
	protected guildId: string;
	public get guild(): Guild | undefined {
		return container.client.guilds.cache.get(this.guildId);
	}

	protected _config: RoleAssignConfig | undefined = undefined;
	public get config() { return this._config; }
	public get fetchOnLoad() { return this._config?.fetchOnLoad; }
	public get roleAssignmentChannel() {
		if (!this._config?.roleChannelId) return undefined;
		return this.guild?.channels.cache.get(this._config.roleChannelId) as GuildTextBasedChannel;
	}

	public constructor(guild: Guild) {
		super(guild, GuildScanRegistryType.RoleAssign, (channel) => channel.id === null);

		this.guildId = guild.id;

		// (async () => {
		// 	await this.loadConfig();
		// 	this.channelFilter = (channel) => channel.id === this.config!.roleChannelId;
		// 	await this.loadRegistry();
		// 	await this.generateLastMessageStore();
		// 	if (this.config!.fetchOnLoad && this.config!.roleChannelId) {
		// 		await this.guild?.scanner.fetchAllMessagesInChannel({
		// 			channel: this.roleAssignmentChannel!,
		// 			lastMessageId: this.registry.get(this.config!.roleChannelId)?.id
		// 		});
		// 		this.collectAllRoleChannelMessages();
		// 	}
		// })()
	}

	public async loadConfig() {
		var loadedConfig = await container.database.roleAssignConfig.findFirst({
			where: {
				guildId: {
					equals: this.guildId
				}
			}
		});

		if (!loadedConfig) {
			// Create new and save.
			loadedConfig = await container.database.roleAssignConfig.create({
				data: {
					guildId: this.guildId
				}
			})
		}

		this._config = loadedConfig;
	}

	public collectAllRoleChannelMessages() {
		if (!this.roleAssignmentChannel) throw new UserError({ identifier: `Role channel was not found.`, context: this._config?.roleChannelId })

		this.collectAllMessagesInChannel(this.roleAssignmentChannel);
	}

	private collectAllMessagesInChannel(channel: GuildTextBasedChannel) {
		for (var [_, message] of channel.messages.cache) {
			const role = message.mentions.roles.first();

			if (role) {
				this.collectOnMessage(message, role);
			}
		}
	}

	public collectOnMessage(message: Message, role: Role) {
		message.createReactionCollector({
			filter: (reaction) => reaction.emoji.name === Emojis.GreenTick,
			dispose: true,
		}).addListener('collect', async (_reaction: MessageReaction, user: User) => {
			const member = message.guild?.members.cache.get(user.id);
			if (member && !member?.roles.cache.has(role.id)) {
				await member?.roles.add(role);
				await member?.send(`You've been granted the role *_${role.name}_* in **${this.guild!.name}**.`)
			}
		}).addListener('remove', async (_reaction: MessageReaction, user: User) => {
			const member = message.guild?.members.cache.get(user.id);
			if (member && member?.roles.cache.has(role.id)) {
				await member?.roles.remove(role);
				await member?.send(`You've been removed from the role *_${role.name}_* in **${this.guild!.name}**.`)
			}
		})
	}

	public async setConfig(args: {
		roleChannelId?: string,
		fetchOnLoad?: boolean
	}) {
		var loadedConfig = await container.database.roleAssignConfig.update({
			where: {
				guildId: this.guildId,
			},
			data: args
		});

		this._config = loadedConfig;

		return loadedConfig;
	}
}