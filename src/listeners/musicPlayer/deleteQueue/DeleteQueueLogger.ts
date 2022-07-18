import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue, Song } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'deleteQueueLogger',
	event: 'deleteQueue',
	emitter: container.client.musicPlayer
})
export class DeleteQueueLogger extends Listener {
	public async run(_queue: Queue, _song : Song) {
		debugLog('debug', `In: ${this.event.toString()}`);
	}
}