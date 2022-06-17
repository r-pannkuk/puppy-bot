import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Message } from "discord.js";
import type { SearchResult } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'searchResultLogger',
	event: 'searchResult',
	emitter: container.client.musicPlayer
})
export class SearchResultLogger extends Listener {
	public async run(_message: Message, _results: SearchResult[], _query: string) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}