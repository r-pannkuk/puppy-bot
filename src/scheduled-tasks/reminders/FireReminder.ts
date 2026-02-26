import { ApplyOptions } from '@sapphire/decorators';
import { container, PieceContext } from '@sapphire/framework';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import type { ReminderManager } from '../../lib/structures/managers/ReminderManager';
import { debugLog } from '../../lib/utils/logging';

/**
 * Scheduled task that fires a single reminder.
 *
 * This task is enqueued by {@link ReminderManager.scheduleReminder} and
 * executed by the Redis/Bull worker when the scheduled time arrives.
 *
 * The task is a no-op if:
 * - The reminder ID from the payload is not found in the in-memory cache
 *   (e.g., it was deleted between scheduling and firing).
 * - The reminder has been marked `isDisabled`.
 */
@ApplyOptions<ScheduledTask.Options>({
	name: 'Reminder_FireReminder',
})
export class Reminder_FireReminder extends ScheduledTask {
	public constructor(context: PieceContext, options: ScheduledTask.Options) {
		super(context, options);
	}

	public async run(payload: ReminderManager.ScheduledTask.Payload) {
		const reminder = container.client.reminders.cache.get(payload.reminderId);

		if (!reminder) {
			debugLog('warn', `[Reminder_FireReminder] Reminder ${payload.reminderId} not found in cache; skipping.`);
			return;
		}

		if (reminder.isDisabled) {
			debugLog('info', `[Reminder_FireReminder] Reminder ${payload.reminderId} is disabled; skipping.`);
			return;
		}

		return container.client.reminders.fireReminder(reminder);
	}
}