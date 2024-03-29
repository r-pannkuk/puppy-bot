import { container } from "@sapphire/framework";
import { ChannelType, type Collection, type Guild, type GuildBasedChannel, type GuildTextBasedChannel, type Message } from "discord.js";
import { debugLog } from "../../utils/logging";
import type { IGuildManager } from "./IGuildManager";

const REQUEST_DELAY = 20000

export type ChannelId = string;
export type LastMessageStore = Collection<ChannelId, Message>;

export class GuildMessageScanner implements IGuildManager {
	protected guildId: string;
	public get guild() {
		return container.client.guilds.cache.get(this.guildId);
	}

	public constructor(guild: Guild) {
		this.guildId = guild.id;
	}

	public async fetchAllMessages(lastMessageStore: LastMessageStore) {
		const channels = this.guild!.channels.cache
			.filter(c =>
				(
					c.type === ChannelType.GuildText ||
					c.type === ChannelType.PublicThread ||
					c.type === ChannelType.GuildAnnouncement ||
					c.type === ChannelType.AnnouncementThread ||
					c.type === ChannelType.PrivateThread
				) &&
				c.permissionsFor(container.client.user!)?.has('ViewChannel') === true &&
				c.messages.cache.size > 0
			);

		container.client.emit(GuildMessageScanner.Events.All.ScanBegun, this.guild!);

		const counts = await Promise.all(channels.map(async (channel) => await this.fetchAllMessagesInChannel({
			channel,
			lastStoredMessageId: lastMessageStore.get(channel.id)?.id
		})));

		const count = counts.reduce((sum, number) => sum + number, 0);
		container.client.emit(GuildMessageScanner.Events.All.ScanEnded, this.guild!, count);

		return count;
	}

	public async fetchAllMessagesInChannel(args: {
		channel: GuildBasedChannel,
		lastStoredMessageId?: string
	}): Promise<number> {
		const { channel, lastStoredMessageId } = args;
		var textChannel = channel as GuildTextBasedChannel;
		if (!textChannel) return 0;

		if (!textChannel.lastMessageId) return 0;

		container.client.emit(GuildMessageScanner.Events.Channel.ScanBegun, channel);

		var messagesRetrieved = 0;

		const count = await recursiveSearch({
			after: (lastStoredMessageId) ? (await textChannel.messages.fetch(lastStoredMessageId) ?? { id: "0", url: undefined }) : { id: "0", url: undefined },
		});

		async function recursiveSearch(query: {
			after: Message | { id: string, url: undefined },
		}): Promise<number> {
			if (!textChannel.lastMessageId || query.after?.id === textChannel.lastMessageId) return messagesRetrieved;

			const MAX_FETCH = 100;

			var messages: Collection<string, Message<boolean>>

			try {
				messages = await textChannel.messages.fetch({
					limit: MAX_FETCH,
					after: query.after.id,
				});

				messages.sort();
				messagesRetrieved += messages.size;

				container.client.emit(GuildMessageScanner.Events.Chunk.Finished, channel, messages);

				if (messages.size < MAX_FETCH) {
					debugLog('info', `Finished scanning ${messagesRetrieved} messages in "#${textChannel.name}".`);
					return messagesRetrieved;
				} else {
					debugLog('info', `Query: ${textChannel.name}: ${query.after?.url}`)
					// if(!query.after || messages.last()!.createdAt > query.after.createdAt) {
					// 	query.after = messages.last()!;
					// }
					// if(!query.before || messages.first()!.createdAt < query.before.createdAt) {
					// 	query.before = messages.first()!;
					// }

					// Continue scanning messages, starting after the last message scanned
					return await recursiveSearch({
						after: messages.last()!,
					});
				}
			} catch (e) {
				await new Promise(r => setTimeout(r, REQUEST_DELAY))
				return await recursiveSearch(query);
			}
		}

		container.client.emit(GuildMessageScanner.Events.Channel.ScanEnded, channel, count);

		return count;
	}
}

export namespace GuildMessageScanner {
	export const Events = {
		All: {
			ScanBegun: 'GuildMessageScanner.All.ScanBegun',
			ScanEnded: 'GuildMessageScanner.All.ScanEnded',
		},
		Channel: {
			ScanBegun: 'GuildMessageScanner.Channel.ScanBegun',
			ScanEnded: 'GuildMessageScanner.Channel.ScanEnded',
		},
		Chunk: {
			Finished: 'GuildMessageScanner.Chunk.Finished',
		}
	}
}