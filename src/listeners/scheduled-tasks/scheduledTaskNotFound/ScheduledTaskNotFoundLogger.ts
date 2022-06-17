import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskNotFound
})
export class ScheduledTaskNotFoundLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskNotFound> {
	public async run(_task: string, _payload: any) {
		container.logger.info(`In: ${this.event.toString()} - Couldn't find ${_task}`);
	}
}