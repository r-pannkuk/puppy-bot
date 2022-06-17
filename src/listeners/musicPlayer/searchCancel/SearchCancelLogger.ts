import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'searchCancelLogger',
	event: 'searchCancel',
	emitter: container.client.musicPlayer
})
export class SearchCancelLogger extends Listener {
	public async run(_message: Message, _query: string) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}