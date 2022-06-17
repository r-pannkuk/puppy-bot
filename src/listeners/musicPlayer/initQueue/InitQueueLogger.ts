import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'initQueueLogger',
	event: 'initQueue',
	emitter: container.client.musicPlayer
})
export class InitQueueLogger extends Listener {
	public async run(_queue: Queue) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}