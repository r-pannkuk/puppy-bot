import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'searchCancelLogger',
	event: 'searchCancel',
	emitter: container.client.musicPlayer
})
export class SearchCancelLogger extends Listener {
	public async run(_message: Message, _query: string) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}