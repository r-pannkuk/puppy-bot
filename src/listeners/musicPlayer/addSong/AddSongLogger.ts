import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue, Song } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'addSongLogger',
	event: 'addSong',
	emitter: container.client.musicPlayer
})
export class AddSongLogger extends Listener {
	public async run(_queue: Queue, _song : Song) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}