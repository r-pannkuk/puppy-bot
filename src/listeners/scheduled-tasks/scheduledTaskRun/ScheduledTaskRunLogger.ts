import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskRun
})
export class ScheduledTaskRunLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskRun> {
	public async run(_task: string, _payload: any) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}