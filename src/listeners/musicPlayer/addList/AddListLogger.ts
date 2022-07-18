import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Playlist, Queue } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'addListLogger',
	event: 'addList',
	emitter: container.client.musicPlayer
})
export class AddListLogger extends Listener {
	public async run(_queue: Queue, _playlist: Playlist) {
		debugLog('debug', `In: ${this.event.toString()}`);
	}
}