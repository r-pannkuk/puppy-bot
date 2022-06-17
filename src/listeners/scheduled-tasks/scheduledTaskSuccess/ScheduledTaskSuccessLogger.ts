import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import { ScheduledTaskEvents } from "@sapphire/plugin-scheduled-tasks";

@ApplyOptions<Listener.Options>({
	event: ScheduledTaskEvents.ScheduledTaskSuccess
})
export class ScheduledTaskSuccessLogger extends Listener<typeof ScheduledTaskEvents.ScheduledTaskSuccess> {
	public async run(_task: string, _payload: any, _result: any, _duration: number) {
		container.logger.info(`In: ${this.event.toString()}`);
	}
}