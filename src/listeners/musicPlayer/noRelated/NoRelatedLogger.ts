import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'noRelatedLogger',
	event: 'noRelated',
	emitter: container.client.musicPlayer
})
export class NoRelatedLogger extends Listener {
	public async run(_queue: Queue) {
		debugLog('debug', `In: ${this.event.toString()}`);
	}
}