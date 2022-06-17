import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Job, JobOptions } from "bull";
import type { Queue, Song } from "distube";
import type { SongProgressPayload } from "../../../scheduled-tasks/musicPlayer/UpdateProgress";

const UPDATE_INTERVAL = 5000;

@ApplyOptions<Listener.Options>({
	name: 'playSongCreateProgress',
	event: 'playSong',
	emitter: container.client.musicPlayer
})
export class PlaySongCreateProgress extends Listener {
	public override async run(queue: Queue, song: Song) {
		await this.container.tasks.run('updateProgress', {
			guildId: queue.clientMember.guild.id,
			songId: song.id,
			override: {
				currentTime: 0,
				duration: song.duration,
				name: song.name
			}
		} as SongProgressPayload);

		const job = await container.tasks.create(
			'updateProgress',
			{
				guildId: queue.clientMember.guild.id,
				songId: song.id
			} as SongProgressPayload,
			{
				bullJobOptions: {
					repeat: {
						limit: Math.floor(song.duration * 1000 / UPDATE_INTERVAL)
					},
					jobId: this.name
				} as JobOptions,
				type: 'repeated',
				interval: UPDATE_INTERVAL
			}
		) as Job;

		queue.job = job;
	}
}


declare module 'distube' {
	interface Queue {
		job: Job;
	}
}