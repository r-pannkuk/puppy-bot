import { ApplyOptions } from '@sapphire/decorators';
import { container, PieceContext } from '@sapphire/framework';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { ReminderManager } from '../../lib/structures/managers/ReminderManager';

@ApplyOptions<ScheduledTask.Options>({
	name: 'Reminder_FireReminder',
})
export class CheckGameStatus_AdvanceWarsByWeb extends ScheduledTask {
	public constructor(context: PieceContext, options: ScheduledTask.Options) {
		super(context, options);
	}

	public async run(payload: ReminderManager.ScheduledTask.Payload) {
		const reminder = container.client.reminders.cache.get(payload.reminderId);

		if (!reminder || reminder?.isDisabled) return;

		const foundJob = await reminder.getJob();

		console.log(foundJob);

		return await container.client.reminders.fireReminder(reminder);
	}
}