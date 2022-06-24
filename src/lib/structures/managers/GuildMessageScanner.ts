import { container } from "@sapphire/framework";
import type { Collection, Guild, GuildBasedChannel, GuildTextBasedChannel, Message } from "discord.js";
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
					c.type === 'GUILD_TEXT' ||
					c.type === 'GUILD_PUBLIC_THREAD' ||
					c.type === "GUILD_NEWS" ||
					c.type === "GUILD_NEWS_THREAD" ||
					c.type === "GUILD_PRIVATE_THREAD"
				) &&
				c.permissionsFor(container.client.user!)?.has('VIEW_CHANNEL') === true &&
				c.messages.cache.size > 0
			);

		container.client.emit(GuildMessageScanner.Events.All.ScanBegun, this.guild!);

		const counts = await Promise.all(channels.map(async (channel) => await this.fetchAllMessagesInChannel({
			channel,
			lastMessageId: lastMessageStore.get(channel.id)?.id
		})));

		const count = counts.reduce((sum, number) => sum + number, 0);
		container.client.emit(GuildMessageScanner.Events.All.ScanEnded, this.guild!, count);

		return count;
	}

	public async fetchAllMessagesInChannel(args: {
		channel: GuildBasedChannel,
		lastMessageId?: string
	}): Promise<number> {
		const { channel, lastMessageId } = args;
		var textChannel = channel as GuildTextBasedChannel;
		if (!textChannel) return 0;

		container.client.emit(GuildMessageScanner.Events.Channel.ScanBegun, channel);

		var messagesRetrieved = 0;

		const count = await recursiveSearch(lastMessageId);

		async function recursiveSearch(lastMessageId?: string) : Promise<number> {
			if(lastMessageId === textChannel.lastMessageId) return 0;

			const MAX_FETCH = 100;

			var messages: Collection<string, Message<boolean>>

			try {
				messages = await textChannel.messages.fetch({
					limit: MAX_FETCH,
					after: lastMessageId,
				});

				messages.sort()
				messagesRetrieved += messages.size;

				container.client.emit(GuildMessageScanner.Events.Chunk.Finished, channel, messages);

				if (messages.size < MAX_FETCH) {
					container.logger.info(`Finished scanning ${messagesRetrieved} messages in "#${textChannel.name}".`);
					return messagesRetrieved;
				} else {
					// Continue scanning messages, starting after the last message scanned
					const lastMessage = messages.last();
					return await recursiveSearch(lastMessage!.id);
				}
			} catch (e) {
				await new Promise(r => setTimeout(r, REQUEST_DELAY))
				return await recursiveSearch(lastMessageId);
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