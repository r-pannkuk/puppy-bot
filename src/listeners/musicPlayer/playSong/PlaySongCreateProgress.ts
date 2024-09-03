import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { Job, JobOptions } from "bull";
import { Events, type Queue, type Song } from "distube";
import type { SongProgressPayload } from "../../../scheduled-tasks/musicPlayer/UpdateProgress";
import { Message, ChatInputCommandInteraction } from "discord.js";

const UPDATE_INTERVAL = 5000;

@ApplyOptions<Listener.Options>({
	name: 'playSongCreateProgress',
	event: Events.PLAY_SONG,
	emitter: container.client.musicPlayer
})
export class PlaySongCreateProgress extends Listener {
	public override async run(queue: Queue, song: Song<Message | ChatInputCommandInteraction>) {
		await this.container.tasks.run('MusicPlayer_UpdateProgress', {
			guildId: queue.clientMember?.guild.id,
			songId: song.id,
			override: {
				currentTime: 0,
				duration: song.duration,
				name: song.name
			}
		} as SongProgressPayload);

		/* const job = */ await container.tasks.create(
			'MusicPlayer_UpdateProgress',
			{
				guildId: queue.clientMember?.guild.id,
				songId: song.id
			} as SongProgressPayload,
			{
				customJobOptions: {
					repeat: {
						limit: Math.floor(song.duration * 1000 / UPDATE_INTERVAL)
					},
					removeOnComplete: true,
				} as JobOptions,
				repeated: true,
				interval: UPDATE_INTERVAL
			}
		);

		// queue.job = job;
	}
}


declare module 'distube' {
	interface Queue {
		job: Job;
	}
}