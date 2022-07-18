import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'finishLogger',
	event: 'finish',
	emitter: container.client.musicPlayer
})
export class FinishLogger extends Listener {
	public async run(_queue: Queue) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}