import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Job } from "bull";
import type { Queue, Song } from "distube";
import type { SongProgressPayload } from "../../../scheduled-tasks/musicPlayer/UpdateProgress";

@ApplyOptions<Listener.Options>({
	name: 'finishSongStartNext',
	event: 'finishSong',
	emitter: container.client.musicPlayer
})
export class FinishSongStartNext extends Listener {
	public async run(queue: Queue, song: Song) {
		container.logger.info(`In: ${this.event.toString()}`);

		await this.container.tasks.run('updateProgress', {
			guildId: queue.clientMember.guild.id,
			songId: song.id,
			override: {
				currentTime: song.duration,
				duration: song.duration,
				name: song.name
			}
		} as SongProgressPayload);

		// const jobId = queue.job.opts.jobId;
		const list = await container.tasks.list({
			name: queue.job.name
		}) as Job[];

		await list.forEach(async j => {
			if (j?.id) {
				try {
					await container.tasks.delete(j.id);
				} catch {
					return;
				}
			}
		});

	}
}