import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	name: 'searchNoResultLogger',
	event: 'searchNoResult',
	emitter: container.client.musicPlayer
})
export class SearchNoResultLogger extends Listener {
	public async run(_message: Message, _query: string) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}