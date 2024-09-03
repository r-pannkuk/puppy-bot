import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { EmbedBuilder, Message, type ChatInputCommandInteraction } from "discord.js";
import { debugLog } from "../../../lib/utils/logging";
import { Events, Queue, Song } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'errorLogger',
	event: Events.ERROR,
	emitter: container.client.musicPlayer
})
export class ErrorLogger extends Listener {
	public async run(error: Error, queue: Queue, song?: Song<Message | ChatInputCommandInteraction>) {
		debugLog('error', error.message);

		const embeds = [
			new EmbedBuilder()
				.setColor("Red")
				.setTitle("DisTube")
				.setDescription(`Error: ${error.message}`),
		];

		if (song) {
			const messageOrInteraction = song.metadata["messageOrInteraction"];

			if (messageOrInteraction instanceof Message) {
				messageOrInteraction.reply({ embeds })
			} else {
				messageOrInteraction.editReply({ embeds });
			}
		} else if (queue.textChannel) {
			queue.textChannel.send({ embeds });
		}
	}
}