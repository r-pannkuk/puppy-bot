import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskRun
})
export class ScheduledTaskRunLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskRun> {
	public async run(_task: string, _payload: any) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}