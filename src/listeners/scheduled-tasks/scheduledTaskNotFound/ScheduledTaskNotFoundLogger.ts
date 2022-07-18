import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskNotFound
})
export class ScheduledTaskNotFoundLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskNotFound> {
	public async run(_task: string, _payload: any) {
		debugLog('debug',`In: ${this.event.toString()} - Couldn't find ${_task}`);
	}
}