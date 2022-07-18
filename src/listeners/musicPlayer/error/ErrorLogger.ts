import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { BaseGuildTextChannel } from "discord.js";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'errorLogger',
	event: 'error',
	emitter: container.client.musicPlayer
})
export class ErrorLogger extends Listener {
	public async run(_channel: BaseGuildTextChannel, _error: Error) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}