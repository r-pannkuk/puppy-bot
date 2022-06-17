import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { BaseGuildTextChannel } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: 'errorLogger',
	event: 'error',
	emitter: container.client.musicPlayer
})
export class ErrorLogger extends Listener {
	public async run(_channel: BaseGuildTextChannel, _error: Error) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}