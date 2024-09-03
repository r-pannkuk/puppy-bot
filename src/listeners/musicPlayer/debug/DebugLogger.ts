import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import {Events } from "distube";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'debugLogger',
	event: Events.DEBUG,
	emitter: container.client.musicPlayer
})
export class DebugLogger extends Listener {
	public async run(message: string) {
		debugLog('debug', message);
	}
}