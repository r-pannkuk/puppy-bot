import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskSuccess
})
export class ScheduledTaskSuccessLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskSuccess> {
	public async run(_task: string, _payload: any, _result: any, _duration: number) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}