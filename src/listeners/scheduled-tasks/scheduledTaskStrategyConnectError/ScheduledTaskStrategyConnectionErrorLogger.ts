import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskStrategyConnectError
})
export class ScheduledTaskStrategyConnectionErrorLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskStrategyConnectError> {
	public async run(_error: Error) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}