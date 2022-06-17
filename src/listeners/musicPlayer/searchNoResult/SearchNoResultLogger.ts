import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'searchNoResultLogger',
	event: 'searchNoResult',
	emitter: container.client.musicPlayer
})
export class SearchNoResultLogger extends Listener {
	public async run(_message: Message, _query: string) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}