import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Queue, Song } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'finishSongStartNext',
	event: 'finishSong',
	emitter: container.client.musicPlayer
})
export class FinishSongStartNext extends Listener {
	public async run(_queue: Queue, _song: Song) {
		// // const jobId = queue.job.opts.jobId;
		// const list = await container.tasks.list({
		// 	name: queue.job.name
		// }) as Job[];

		// await list.forEach(async j => {
		// 	if (j?.id) {
		// 		try {
		// 			await container.tasks.delete(j.id);
		// 		} catch {
		// 			return;
		// 		}
		// 	}
		// });

	}
}