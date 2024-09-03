import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { DisTubeError, Events, type Queue } from "distube";
import { debugLog } from "../../../lib/utils/logging";
import { EmbedBuilder } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'noRelatedLogger',
	event: Events.NO_RELATED,
	emitter: container.client.musicPlayer
})
export class NoRelatedLogger extends Listener {
	public async run(queue: Queue, error: DisTubeError) {
		debugLog('error', error.message);
		
		const embeds = [
			new EmbedBuilder().
				setColor("Red")
				.setTitle("DisTube")
				.setDescription(error.message)
		];

		queue.textChannel?.send({ embeds });
	}
}