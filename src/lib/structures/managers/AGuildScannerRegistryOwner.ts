import type { GuildScanRegistryType, GuildScanRegistryRecord as _GuildScanRegistryRecord } from "@prisma/client";
import { container } from "@sapphire/framework";
import { Collection, Guild, GuildTextBasedChannel } from "discord.js";
import type { ChannelId, LastMessageStore } from "./GuildMessageScanner";
import type { IGuildManager } from "./IGuildManager";

export type GuildScanRegistryRecord<T extends GuildScanRegistryType> = Omit<Omit<_GuildScanRegistryRecord, 'type'>, 'id'> & {
	id?: string,
	type: T,
}

export abstract class AGuildScannerRegistryOwner<T extends GuildScanRegistryType> implements IGuildManager {
	protected guildId: string;
	public get guild() {
		return container.client.guilds.cache.get(this.guildId);
	}
	public channelFilter: (channel: GuildTextBasedChannel) => boolean;
	public get channels() {
		return this.guild!.channels.cache
			.filter((channel) => {
				const textChannel = channel as GuildTextBasedChannel;
				if (!textChannel) return false;

				return this.channelFilter(textChannel);
			})
	}

	protected scanType: T;

	protected _registry: Collection<ChannelId, GuildScanRegistryRecord<T>>;
	public get registry(): Collection<ChannelId, GuildScanRegistryRecord<T>> {
		return this._registry;
	}

	protected _lastMessageStore: LastMessageStore;
	public get lastMessageStore(): LastMessageStore {
		return this._lastMessageStore;
	}

	public constructor(guild: Guild, type: T, channelFilter: (channel: GuildTextBasedChannel) => boolean) {
		this.guildId = guild.id;
		this._registry = new Collection();
		this._lastMessageStore = new Collection();
		this.scanType = type;
		this.channelFilter = channelFilter;

		// (async () => {
		// 	await this.loadRegistry();
		// 	await this.generateLastMessageStore();
		// })()
	}

	public async loadRegistry() {
		const scanType = this.scanType;
		var loadedRegistry = await container.database.guildScanRegistryRecord.findMany({
			where: {
				guildId: {
					equals: this.guildId
				},
				type: {
					equals: scanType
				}
			}
		});

		if (!loadedRegistry) {
			await container.database.guildScanRegistryRecord.createMany({
				data: this.channels.map((channel) => (
					{
						guildId: this.guildId,
						channelId: channel.id,
						type: scanType,
					})
				),
			});

			loadedRegistry = await container.database.guildScanRegistryRecord.findMany({
				where: {
					guildId: {
						equals: this.guildId
					},
					type: {
						equals: scanType
					}
				}
			});
		}
		this._registry = new Collection(Array.from(loadedRegistry.map(record => [record.channelId, record as GuildScanRegistryRecord<typeof scanType>])));

		for (var [id] of this.channels) {
			if (!this._registry.has(id)) {
				this._registry.set(id, {
					channelId: id,
					guildId: this.guildId,
					lastMessageScannedId: null,
					type: this.scanType,
				})
			}
		}
	}

	public async writeRegistry() {
		await container.database.$transaction([
			...this._registry.map((record) => {
				var purgedRecordId = record;
				delete purgedRecordId.id;
				return container.database.guildScanRegistryRecord.upsert({
					where: {
						guildId_channelId_type: {
							guildId: this.guildId,
							channelId: record.channelId,
							type: this.scanType
						}
					},
					create: purgedRecordId,
					update: purgedRecordId,
				})
			})
		])
	}

	public async generateLastMessageStore() {
		if (!this.guild) return;

		for (var [_, record] of this._registry) {
			if (record.lastMessageScannedId) {
				const channel = (this.guild.channels.cache.get(record.channelId)) as GuildTextBasedChannel;
				const message = await channel.messages.fetch(record.lastMessageScannedId);

				if (!this.lastMessageStore.has(channel.id) || (this.lastMessageStore.get(channel.id)!.createdAt < message.createdAt)) {
					this.lastMessageStore.set(channel.id, message);
				}
			}
		}
	}
}