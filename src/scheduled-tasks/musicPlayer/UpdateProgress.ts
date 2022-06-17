import { ApplyOptions } from "@sapphire/decorators";
import { ScheduledTask, ScheduledTaskOptions } from "@sapphire/plugin-scheduled-tasks";
import type { Message } from "discord.js";
import type { GuildIdResolvable, Song } from "distube";

/**
	* 
	* @param {number} current 
	* @param {number} end 
	* @param {Object} options
	* @param {number} options.scale
	* @param {string} options.token
	* @param {Object} options.bookend
	* @param {Object} options.bookend.start
	* @param {Object} options.bookend.end
	*/
export interface IProgressBarOptions {
	scale: number;
	token: string;
	blank: string;
	bookend: {
		start: string;
		end: string;
	};
}

function visualProgressBar(current: number, end: number, options: IProgressBarOptions = {
	scale: 20,
	token: "▣",
	blank: "▢",
	bookend: {
		start: "▐",
		end: "▌"
	}
}) {
	var interval = Math.floor(current / end * options.scale);

	var string = options.bookend.start;

	for (var i = 0; i < interval; ++i) {
		string += options.token;
	}
	while (i < options.scale) {
		string += options.blank;
		++i;
	}

	string += options.bookend.end;

	return string;
}

function toHHMMSS(duration_seconds: number) {
	var sec_num = Math.floor(duration_seconds); // don't forget the second param
	var hours: number | string = Math.floor(sec_num / 3600);
	var minutes: number | string = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds: number | string = Math.round(sec_num - (hours * 3600) - (minutes * 60));

	if (hours < 10) { hours = "0" + hours.toString(); }
	if (minutes < 10) { minutes = "0" + minutes.toString(); }
	if (seconds < 10) { seconds = "0" + seconds.toString(); }
	return hours.toString() + ':' + minutes.toString() + ':' + seconds.toString();
}

export interface SongProgressPayload {
	guildId: GuildIdResolvable,
	songId: string,
	override : {
		currentTime: number | undefined,
		duration: number | undefined,
		name: string | undefined
	}
}


@ApplyOptions<ScheduledTaskOptions>({
	name: 'updateProgress'
})
export class UpdateProgressTask extends ScheduledTask {
	public message: Message | undefined;
	public song: Song | undefined;

	public override async run(payload: SongProgressPayload) {
		if (!payload.guildId || !payload.songId) {
			return;
		}

		const oldSong = this.song;

		const queue = this.container.client.musicPlayer.getQueue(payload.guildId)
		this.song = queue?.songs[0] || queue?.previousSongs[0] as Song || this.song;

		var currentTime = payload.override?.currentTime || ((queue?.currentTime !== undefined) ? queue?.currentTime : this.song.duration);
		var duration = payload.override?.duration || this.song!.duration;
		var name = payload.override?.name || this.song!.name;

		const progress = visualProgressBar(currentTime, duration);
		const content = `Now playing: **${name}**\n` +
			`${progress} ` +
			`${toHHMMSS(currentTime)}/${toHHMMSS(duration)}`;

		if (!this.message || this.song?.id !== oldSong?.id) {
			this.message = await queue!.textChannel?.send({
				content: content
			});
		} else {
			await this.message.edit({
				content: content
			});
		}
	}
}