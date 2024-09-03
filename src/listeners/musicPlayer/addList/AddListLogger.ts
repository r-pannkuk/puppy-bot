import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ChatInputCommandInteraction, EmbedBuilder, Message } from "discord.js";
import { Events, type Playlist, type Queue } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'addListLogger',
	event: Events.ADD_LIST,
	emitter: container.client.musicPlayer
})
export class AddListLogger extends Listener {
	public async run(_queue: Queue, playlist: Playlist<Message | ChatInputCommandInteraction>) {
		const messageOrInteraction = playlist.metadata["messageOrInteraction"];
		const embeds = [
			new EmbedBuilder()
				.setColor("Blurple")
				.setTitle("DisTube")
				.setDescription(`Added \`${playlist.name}\` (${playlist.songs.length} songs) to the queue`),
		];

		if (messageOrInteraction instanceof Message) {
			messageOrInteraction.reply({ embeds })
		} else {
			messageOrInteraction.editReply({ embeds });
		}
	}
}