import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { GuildMessageScanner } from "../../../../../lib/structures/managers/GuildMessageScanner";

@ApplyOptions<Listener.Options>({
	emitter: container.client,
	event: GuildMessageScanner.Events.Chunk.Finished
})
export class GuildMessageScannerChunkFinished_EmojiUsageTrackStats extends Listener<typeof GuildMessageScanner.Events.Chunk.Finished> {
	public async run(channel: GuildTextBasedChannel, messages: Collection<string, Message>) {
		if(messages.size === 0) return;

		const lastMessage = channel.guild.emojiUsage.lastMessageStore.get(channel.id);

		if(!lastMessage || messages.last()!.createdAt > lastMessage.createdAt) {
			if(lastMessage) {
				messages = messages.filter((message) => message.createdAt > lastMessage.createdAt);
			}

			channel.guild.emojiUsage.collectChunk(messages);
		}
	}
}