import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskFinished
})
export class ScheduledTaskFinishedLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskFinished> {
	public async run(_task: string, _duration: number, _payload: any) {
		container.logger.info(`In: ${this.event.toString()} [${_task}, ${_duration}, ${_payload}]`);
	}
}