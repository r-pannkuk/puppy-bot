import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { debugLog } from "../../../lib/utils/logging";
import { Events } from "distube";

@ApplyOptions<Listener.Options>({
	name: 'ffmpegDebugErrorLogger',
	event: Events.FFMPEG_DEBUG,
	emitter: container.client.musicPlayer
})
export class FFMPEGDebugErrorLogger extends Listener {
	public async run(message: string) {
		debugLog('debug', message);
	}
}