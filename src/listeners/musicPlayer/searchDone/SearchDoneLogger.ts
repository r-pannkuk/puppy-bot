import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'searchDoneLogger',
	event: 'searchDone',
	emitter: container.client.musicPlayer
})
export class SearchDoneLogger extends Listener {
	public async run(_message: Message, _answer: Message, _query: string) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}