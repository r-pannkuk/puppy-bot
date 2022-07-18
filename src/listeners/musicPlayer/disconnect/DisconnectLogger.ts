import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'disconnectLogger',
	event: 'disconnect',
	emitter: container.client.musicPlayer
})
export class DisconnectLogger extends Listener {
	public async run(_queue: Queue) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}