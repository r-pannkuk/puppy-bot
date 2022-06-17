import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskError
})
export class ScheduledTaskErrorLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskError> {
	public async run(_error: Error, _task: string, _duration: number, _payload: any) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}