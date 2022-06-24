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

		const previousLastMessage = channel.guild.emojiUsage.lastMessageStore.get(channel.id);

		if(!previousLastMessage || messages.last()!.createdAt > previousLastMessage.createdAt) {
			if(previousLastMessage) {
				messages = messages.filter((message) => message.createdAt > previousLastMessage.createdAt);
			}

			channel.guild.emojiUsage.collectChunk(messages);
		}
	}
}