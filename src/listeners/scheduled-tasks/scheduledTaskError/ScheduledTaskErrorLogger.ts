import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskError
})
export class ScheduledTaskErrorLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskError> {
	public async run(_error: Error, _task: string, _payload: any) {
		debugLog('debug',`In: ${this.event.toString()} - ${_error}`);
	}
}