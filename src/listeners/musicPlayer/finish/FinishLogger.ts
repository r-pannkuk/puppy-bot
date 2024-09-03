import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { Events, type Queue } from "distube";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'finishLogger',
	event: Events.FINISH,
	emitter: container.client.musicPlayer
})
export class FinishLogger extends Listener {
	public async run(queue: Queue) {
		const embeds = [
			new EmbedBuilder()
				.setColor("Green")
				.setTitle("DisTube")
				.setDescription(`Queue finished.`),
		];
		queue.textChannel?.send({embeds});
	}
}