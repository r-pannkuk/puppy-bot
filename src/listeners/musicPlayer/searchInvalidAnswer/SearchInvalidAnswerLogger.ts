import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'searchInvalidAnswerLogger',
	event: 'searchInvalidAnswer',
	emitter: container.client.musicPlayer
})
export class SearchInvalidAnswerLogger extends Listener {
	public async run(_message: Message, _answer: Message, _query: string) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}