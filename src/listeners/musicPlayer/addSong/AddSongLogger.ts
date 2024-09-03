import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { Events, type Queue, type Song } from "distube";
import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'addSongLogger',
	event: Events.ADD_SONG,
	emitter: container.client.musicPlayer
})
export class AddSongLogger extends Listener {
	public async run(_queue: Queue, song: Song<Message | ChatInputCommandInteraction>) {
		const messageOrInteraction = song.metadata["messageOrInteraction"];
		const embeds = [
			new EmbedBuilder()
				.setColor("Blurple")
				.setTitle("DisTube")
				.setDescription(`Added \`${song.name}\` to the queue`),
		];

		if (messageOrInteraction instanceof Message) {
			messageOrInteraction.reply({ embeds })
		} else {
			messageOrInteraction.editReply({ embeds });
		}
	}
}