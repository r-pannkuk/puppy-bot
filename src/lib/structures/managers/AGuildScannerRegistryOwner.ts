import type { GuildScanRegistryType, GuildScanRegistryRecord as _GuildScanRegistryRecord } from "@prisma/client";
import { container } from "@sapphire/framework";
import { Collection, Guild, GuildTextBasedChannel, Message } from "discord.js";
import type { ChannelId, LastMessageStore } from "./GuildMessageScanner";
import type { IGuildManager } from "./IGuildManager";

export type GuildScanRegistryRecord<T extends GuildScanRegistryType> = Omit<Omit<_GuildScanRegistryRecord, 'type'>, 'id'> & {
	id?: string,
	type: T,
	createdTimestamp?: number,
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

	protected _registry: Collection<ChannelId, AGuildScannerRegistryOwner.GuildScanRegistryRecord<T>>;
	public get registry(): Collection<ChannelId, AGuildScannerRegistryOwner.GuildScanRegistryRecord<T>> {
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

	protected async _instantiateRecord(record: _GuildScanRegistryRecord | Omit<_GuildScanRegistryRecord, 'id'>) {
		const fetchChannel = async () => this.guild?.channels.cache.get(record.channelId);
		const fetchMessage = async () => (record.lastMessageScannedId) ? await ((await fetchChannel()) as GuildTextBasedChannel)?.messages.fetch(record.lastMessageScannedId) : null;
		return {
			...record,
			fetchChannel,
			fetchMessage,
			createdTimestamp: (await fetchMessage())?.createdTimestamp,
		} as AGuildScannerRegistryOwner.GuildScanRegistryRecord<typeof this.scanType>;
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

		this._registry = new Collection(
			Array.from(
				await Promise.all(loadedRegistry.map(async (record) =>
					[record.channelId, await this._instantiateRecord(record)]
				)) as [string, AGuildScannerRegistryOwner.GuildScanRegistryRecord<typeof scanType>][]
			)
		);

		for (var [id] of this.channels) {
			if (!this._registry.has(id)) {
				this._registry.set(id, await this._instantiateRecord({
					channelId: id,
					guildId: this.guildId,
					lastMessageScannedId: null,
					type: this.scanType,
				}))
			}
		}
	}

	public async writeRegistry() {
		await container.database.$transaction([
			...this._registry.map((record) => {
				return container.database.guildScanRegistryRecord.upsert({
					where: {
						guildId_channelId_type: {
							guildId: this.guildId,
							channelId: record.channelId,
							type: this.scanType
						}
					},
					create: {
						id: record.id,
						channelId: record.channelId,
						guildId: record.guildId,
						lastMessageScannedId: record.lastMessageScannedId,
						type: record.type,
					},
					update: {
						channelId: record.channelId,
						guildId: record.guildId,
						lastMessageScannedId: record.lastMessageScannedId,
						type: record.type,
					},
				})
			})
		])
	}

	public async generateLastMessageStore() {
		if (!this.guild) return;

		for (var [_, record] of this._registry) {
			if (record.lastMessageScannedId) {
				const channel = (this.guild.channels.cache.get(record.channelId)) as GuildTextBasedChannel;
				if(!channel) continue;

				const message = await channel.messages.fetch(record.lastMessageScannedId);

				if (!this.lastMessageStore.has(channel.id) || (this.lastMessageStore.get(channel.id)!.createdAt < message.createdAt)) {
					this.lastMessageStore.set(channel.id, message);
				}
			}
		}
	}
}

export namespace AGuildScannerRegistryOwner {
	export interface GuildScanRegistryRecord<T extends GuildScanRegistryType> extends Omit<Omit<_GuildScanRegistryRecord, 'type'>, 'id'> {
		id?: string,
		type: T,
		fetchChannel(): Promise<GuildTextBasedChannel>,
		fetchMessage(): Promise<Message> | null,
		createdTimestamp?: number,
	}
}