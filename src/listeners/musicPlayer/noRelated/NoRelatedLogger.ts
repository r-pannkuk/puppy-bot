import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'noRelatedLogger',
	event: 'noRelated',
	emitter: container.client.musicPlayer
})
export class NoRelatedLogger extends Listener {
	public async run(_queue: Queue) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}