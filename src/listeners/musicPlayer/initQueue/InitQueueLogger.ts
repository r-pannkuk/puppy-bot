import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { Events, type Queue } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'initQueueLogger',
	event: Events.INIT_QUEUE,
	emitter: container.client.musicPlayer
})
export class InitQueueLogger extends Listener {
	public async run(queue: Queue) {
		queue.volume = 100;
	}
}