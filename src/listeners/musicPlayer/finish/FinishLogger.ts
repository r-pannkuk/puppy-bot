import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'finishLogger',
	event: 'finish',
	emitter: container.client.musicPlayer
})
export class FinishLogger extends Listener {
	public async run(_queue: Queue) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}