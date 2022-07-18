import { ApplyOptions } from "@sapphire/decorators";
import { Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";
import { debugLog } from "../../../lib/utils/logging";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskStrategyConnectError
})
export class ScheduledTaskStrategyConnectionErrorLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskStrategyConnectError> {
	public async run(_error: Error) {
		debugLog('debug',`In: ${this.event.toString()}`);
	}
}