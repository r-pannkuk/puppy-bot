/**
 * @file ReminderManager.ts
 * @description Global manager for all reminder data.
 *
 * Architecture:
 * - MongoDB (via Prisma) is the **source of truth** for all reminders.
 * - Redis/Bull (via Sapphire's plugin-scheduled-tasks) is the **execution
 *   engine** for firing reminders on schedule.
 * - The in-memory `_cache` mirrors the database for fast lookups without
 *   per-request DB reads.
 *
 * On bot startup, {@link ReminderManager.loadData} loads all active reminders
 * from MongoDB and re-enqueues pending jobs so that reminders survive
 * process restarts (which would otherwise clear the Redis queue).
 */
import {
	DiscordLocation,
	Prisma,
	Reminder as _Reminder,
	ReminderEvent as _ReminderEvent,
	ReminderEventType,
	ReminderSchedule as _ReminderSchedule,
	ReminderTargetType,
} from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import type { ScheduledTasksTaskOptions } from "@sapphire/plugin-scheduled-tasks";
import type Bull from "bull";
import type { Job, JobOptions } from "bull";
import { Collection, DMChannel, GuildMember, GuildTextBasedChannel, Role, User } from "discord.js";
import { ReminderCommand } from "../../../commands/reminders/Reminder";

export type ReminderId = string;
export type ScheduleId = string;
export type EventId = string;

export type ValidTarget = {
	type: typeof ReminderTargetType.User,
	mentionableIds: string[],
	guildId?: string | null,
	channelId: string,
} | {
	type: typeof ReminderTargetType.Role,
	mentionableIds: string[],
	guildId: string,
	channelId: string,
} | {
	type: typeof ReminderTargetType.Channel,
	mentionableIds: string[],
	guildId: string,
	channelId: string,
};

export class ReminderManager {
	protected _cache: Collection<ReminderId, ReminderManager.Reminder.Instance>;
	public get cache() {
		return this._cache.clone();
	}

	public constructor() {
		this._cache = new Collection();
		// (async () => {
		// 	await this.loadData();
		// })()
	}

	private _instantiateSchedule(schedule: _ReminderSchedule) {
		const getNextInstance = () => {
			if (schedule.repeat.isRepeating) {
				var timestamp = schedule.reminderTime.getTime();
				if (schedule.repeat.isInfinite) {
					while (timestamp <= Date.now()) timestamp += Number(schedule.repeat.interval);
					return new Date(timestamp);
				} else {
					if(timestamp <= Date.now()) return new Date(timestamp);
					return new Date(schedule.reminderTime.getTime() + Number(schedule.repeat.interval));
				}
			} else {
				return schedule.reminderTime;
			}
		}
		return {
			...schedule,
			getNextInstance,
			getReminder: () => this._cache.get(schedule.reminderId)
		} as ReminderManager.Schedule.Instance;
	}

	private _instantiateEvent(event: _ReminderEvent) {
		return {
			...event,
			getReminder: () => this._cache.get(event.reminderId)
		} as ReminderManager.Event.Instance<typeof event.eventType>;
	}

	private _instantiateReminder(reminder: (_Reminder & {
		events: _ReminderEvent[];
		schedules: _ReminderSchedule[];
	})) {
		const events = new Collection(Array.from(reminder.events, (event) => [event.id, this._instantiateEvent(event)]));
		const schedules = new Collection(Array.from(reminder.schedules, (schedule) => [schedule.id, this._instantiateSchedule(schedule)]));

		const getCreatedEvent = () => events.find((event) => event.eventType === ReminderEventType.Create)!
		const getActiveSchedule = () => schedules.find((value) => !value.isDisabled);
		const getLastFireEvent = () => events.filter(event => event.eventType === ReminderEventType.Fire).last();
		const getExecutionNumber = () => events.filter((value) => value.eventType === ReminderEventType.Fire).size;
		const getIsPending = () => (getActiveSchedule()) ? (getActiveSchedule()!.getNextInstance().getTime() > Date.now() || getActiveSchedule()!.repeat.isInfinite) : false;
		const getOwner = () => container.client.users.cache.get(reminder.ownerId)!;
		// Note: container.tasks.get(jobId) looks up a Bull job by its string ID.
		// Now that scheduleReminder() correctly stores the actual Bull job ID,
		// this lookup will work. Previously it stored the MongoDB ObjectId instead.
		const getJob = () => reminder.jobId
			? container.tasks.get(reminder.jobId)
			: undefined;

		return {
			...reminder,
			events,
			schedules,
			getCreatedEvent,
			getActiveSchedule,
			getLastFireEvent,
			getExecutionNumber,
			getIsPending,
			getOwner,
			getJob,
		} as ReminderManager.Reminder.Instance;
	}

	/**
	 * Loads all active (non-disabled) reminders from MongoDB into the
	 * in-memory cache, then calls {@link scheduleAllPendingReminders} to
	 * re-queue any jobs that were dropped when the process restarted.
	 */
	public async loadData() {
		const loadedReminders = await container.database.reminder.findMany({
			where: { isDisabled: false },
			include: {
				events: true,
				schedules: true,
			},
		});

		for (const reminder of loadedReminders) {
			this._cache.set(reminder.id, this._instantiateReminder(reminder));
		}

		// Restore any pending jobs into the Redis/Bull queue so reminders
		// fire correctly even after a process restart.
		await this.scheduleAllPendingReminders();
	}

	/**
	 * Iterates the in-memory cache and enqueues a Bull job for every reminder
	 * that is pending (not disabled, has an active schedule, and whose next
	 * fire time is in the future). Updates the `jobId` field in MongoDB.
	 *
	 * This should be called once after {@link loadData} on startup.
	 */
	public async scheduleAllPendingReminders() {
		for (const [, reminder] of this._cache) {
			if (reminder.isDisabled) continue;
			const schedule = reminder.getActiveSchedule();
			if (!schedule) continue;
			if (schedule.getNextInstance() <= new Date()) continue;

			const jobId = await this.scheduleReminder(reminder);
			if (!jobId) continue;

			reminder.jobId = jobId;
			await container.database.reminder.update({
				where: { id: reminder.id },
				data: { jobId },
			});
			this._cache.set(reminder.id, reminder);
		}
	}

	/**
	 * Enqueues a Bull job for this reminder's active schedule.
	 *
	 * @returns The Bull job ID (as a string) to be stored in MongoDB as `jobId`,
	 *          or `null` if the reminder has no active schedule or its next
	 *          fire time is already in the past.
	 */
	private async scheduleReminder(reminder: ReminderManager.Reminder.Instance): Promise<string | null> {
		const schedule = reminder.getActiveSchedule();

		if (!schedule) return null;

		const delay = schedule.getNextInstance().getTime() - Date.now();
		// Don't schedule reminders whose next fire time has already passed.
		if (delay < 0) return null;

		const duration: ScheduledTasksTaskOptions = {
			repeated: false,
			delay,
			customJobOptions: {
				removeOnComplete: true,
			} as JobOptions,
		};

		if (schedule.repeat.isRepeating) {
			const interval = Number(schedule.repeat.interval);
			duration.customJobOptions!.repeat = {
				every: interval,
			} as Bull.RepeatOptions;

			if (!schedule.repeat.isInfinite) {
				(duration.customJobOptions as JobOptions).repeat!.limit = 1;
			}
		}

		try {
			// Wrap in Promise.race so a hung bullmq Queue.add() (a Promise that
			// never settles) cannot block startup indefinitely.
			const job = await Promise.race([
				container.tasks.create(
					'Reminder_FireReminder',
					{ reminderId: reminder.id } as ReminderManager.ScheduledTask.Payload,
					duration,
				),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Bull task creation timed out after 5 s')), 5_000)
				),
			]);

			// Bull job IDs may be numbers or strings; normalize to string for DB storage.
			return job?.id !== undefined ? String(job.id) : null;
		} catch (error) {
			container.logger.error(`[ReminderManager] Failed to schedule job for reminder ${reminder.id}:`, error);
			return null;
		}
	}

	public async createReminder(reminder: {
		ownerId: string,
		target: ValidTarget,
		location: DiscordLocation,
		content: string,
		schedule: {
			reminderTime: Date,
		}
	}) {
		const createdReminder = await container.database.reminder.create({
			data: {
				content: reminder.content,
				createdAt: new Date(Date.now()),
				isDisabled: false,
				ownerId: reminder.ownerId,
				target: reminder.target,
				schedules: {
					create: {
						reminderTime: reminder.schedule.reminderTime,
						repeat: {
							isRepeating: false,
						}
					}
				},
				events: {
					create: {
						eventType: ReminderEventType.Create,
						location: reminder.location,
						payload: {

						} as ReminderManager.Event.Payload.Create
					}
				}
			},
			include: {
				schedules: true,
				events: true,
			}
		});

		const instantiatedReminder = this._instantiateReminder(createdReminder);

		const jobId = await this.scheduleReminder(instantiatedReminder);

		if (!jobId) {
			throw new UserError({ identifier: 'Invalid Schedule', context: instantiatedReminder });
		}

		instantiatedReminder.jobId = jobId;

		await container.database.reminder.update({
			where: {
				id: createdReminder.id
			},
			data: {
				jobId: instantiatedReminder.jobId
			}
		});

		this._cache.set(instantiatedReminder.id, instantiatedReminder);
		return this._cache.get(instantiatedReminder.id)!;
	}

	public async fireReminder(reminder: ReminderManager.Reminder.Instance) {
		const guild = container.client.guilds.cache.get(reminder.target.guildId ?? ``);
		const guildChannel = guild?.channels.cache.get(reminder.target.channelId ?? ``) as GuildTextBasedChannel;

		let mentionables: (User | Role)[] = reminder.target.mentionableIds
			.map((id) => container.client.users.cache.get(id) ?? guild?.roles.cache.get(id))
			.filter((mentioned) => mentioned !== undefined) as (User | Role)[];

		if (!mentionables || mentionables.length === 0) throw new UserError({ identifier: `Could not find target mentionable.`, context: reminder });

		let target: GuildTextBasedChannel | DMChannel;

		if (guildChannel) {
			target = guildChannel;
		} else {
			target = await (mentionables.at(0) as User)?.createDM();
		}

		if (!target) throw new UserError({ identifier: `Could not find target destination.`, context: reminder })

		const response = await ReminderCommand.executeFollowUp(
			(options) => target.send(options),
			reminder,
			reminder.getOwner(),
			{
				state: 'FIRED'
			}
		)

		const updatedReminder = await container.database.reminder.update({
			where: {
				id: reminder.id,
			},
			data: {
				events: {
					create: {
						eventType: ReminderEventType.Fire,
						location: {
							channelId: response.channel.id,
							messageId: response.id,
							guildId: response.guildId,
						},
						payload: {

						} as ReminderManager.Event.Payload.Fire
					}
				}
			},
			include: {
				events: true,
				schedules: true,
			}
		});

		this._cache.set(updatedReminder.id, this._instantiateReminder(updatedReminder));
		return this._cache.get(updatedReminder.id);
	}

	public async subscribeToReminder(reminder: ReminderManager.Reminder.Instance, user: User | GuildMember, location: DiscordLocation) {
		const updatedReminder = await container.database.reminder.update({
			where: {
				id: reminder.id,
			},
			data: {
				target: {
					...reminder.target,
					mentionableIds: reminder.target.mentionableIds.concat([user.id])
				},
				events: {
					create: {
						eventType: ReminderEventType.Subscribe,
						location,
						payload: {
							userId: user.id,
						} as ReminderManager.Event.Payload.Subscribe
					}
				}
			},
			include: {
				events: true,
				schedules: true,
			}
		})

		this._cache.set(updatedReminder.id, this._instantiateReminder(updatedReminder));
		return this._cache.get(updatedReminder.id);
	}

	public async unsubscribeToReminder(reminder: ReminderManager.Reminder.Instance, user: User | GuildMember, location: DiscordLocation) {
		const updatedReminder = await container.database.reminder.update({
			where: {
				id: reminder.id,
			},
			data: {
				target: {
					...reminder.target,
					mentionableIds: reminder.target.mentionableIds.filter((id) => id !== user.id)
				},
				events: {
					create: {
						eventType: ReminderEventType.Unsubscribe,
						location,
						payload: {
							userId: user.id,
						} as ReminderManager.Event.Payload.Unsubscribe
					}
				}
			},
			include: {
				events: true,
				schedules: true,
			}
		})

		this._cache.set(updatedReminder.id, this._instantiateReminder(updatedReminder));
		return this._cache.get(updatedReminder.id);
	}

	public async rescheduleReminder(reminder: ReminderManager.Reminder.Instance, schedule: _ReminderSchedule, location: DiscordLocation) {
		const updatedReminder = await container.database.reminder.update({
			where: {
				id: reminder.id,
			},
			data: {
				isDisabled: false,
				events: {
					create: {
						eventType: ReminderEventType.Reschedule,
						location,
						payload: {

						} as ReminderManager.Event.Payload.Reschedule
					},
				},
				schedules: {
					create: {
						reminderTime: schedule.reminderTime,
						repeat: {
							isRepeating: schedule.repeat?.isRepeating ?? false,
							isInfinite: schedule.repeat?.isInfinite,
							interval: schedule.repeat?.interval,
						},
					},
					update: reminder.schedules.map((s) => ({
						where: {
							id: s.id,
						},
						data: {
							isDisabled: true,
						}
					}))
				}
			},
			include: {
				events: true,
				schedules: true,
			}
		});

		const instantiatedReminder = this._instantiateReminder(updatedReminder);

		const jobId = await this.scheduleReminder(instantiatedReminder);

		if (!jobId) {
			throw new UserError({ identifier: 'Invalid Schedule', context: instantiatedReminder });
		}

		instantiatedReminder.jobId = jobId;

		await container.database.reminder.update({
			where: {
				id: instantiatedReminder.id
			},
			data: {
				jobId: instantiatedReminder.jobId
			}
		});

		this._cache.set(updatedReminder.id, instantiatedReminder);
		return this._cache.get(updatedReminder.id);
	}

	public async stopReminder(reminder: ReminderManager.Reminder.Instance, location: DiscordLocation) {
		const updatedReminder = await container.database.reminder.update({
			where: {
				id: reminder.id,
			},
			data: {
				isDisabled: true,
				schedules: {
					update: reminder.schedules.map(schedule => ({
						where: {
							id: schedule.id,
						},
						data: {
							isDisabled: true,
						}
					}))
				},
				events: {
					create: {
						eventType: ReminderEventType.Stop,
						location,
						payload: {

						}
					}
				}
			},
			include: {
				events: true,
				schedules: true,
			}
		});

		const instantiatedReminder = this._instantiateReminder(updatedReminder);

		await this.scheduleReminder(instantiatedReminder);

		this._cache.set(instantiatedReminder.id, instantiatedReminder);
		return this._cache.get(instantiatedReminder.id);
	}
}

export namespace ReminderManager {
	export namespace Reminder {
		export interface Instance extends _Reminder {
			events: Collection<EventId, Event.Instance<ReminderEventType>>,
			schedules: Collection<ScheduleId, Schedule.Instance>
			getIsPending(): boolean,
			getExecutionNumber(): number,
			getActiveSchedule(): Schedule.Instance | undefined,
			getCreatedEvent(): Event.Instance<'Create'>,
			getLastFireEvent(): Event.Instance<'Fire'> | undefined,
			getOwner(): User,
			getJob(): Promise<Job | null> | undefined,
		}
	}

	export namespace Schedule {
		export interface Instance extends _ReminderSchedule {
			getNextInstance(): Date,
			getReminder(): Reminder.Instance
		}
	}

	export namespace Event {
		export interface Instance<T extends ReminderEventType> extends Omit<Omit<_ReminderEvent, 'payload'>, 'eventType'> {
			eventType: T,
			getReminder(): Reminder.Instance,
			payload: Payload<T>
		}

		export namespace Payload {
			export interface Create extends Prisma.JsonObject {

			}

			export interface Fire extends Prisma.JsonObject {

			}

			export interface Reschedule extends Prisma.JsonObject {

			}

			export interface Stop extends Prisma.JsonObject {

			}

			export interface Subscribe extends Prisma.JsonObject {
				userId: string
			}

			export interface Unsubscribe extends Prisma.JsonObject {
				userId: string
			}
		}

		export type Payload<T extends ReminderEventType> =
			(
				T extends typeof ReminderEventType.Create
				? Payload.Create
				: never
			) | (
				T extends typeof ReminderEventType.Fire
				? Payload.Fire
				: never
			) | (
				T extends typeof ReminderEventType.Reschedule
				? Payload.Reschedule
				: never
			) | (
				T extends typeof ReminderEventType.Stop
				? Payload.Stop
				: never
			) | (
				T extends typeof ReminderEventType.Subscribe
				? Payload.Subscribe
				: never
			) | (
				T extends typeof ReminderEventType.Unsubscribe
				? Payload.Unsubscribe
				: never
			)
	}

	export namespace ScheduledTask {
		export const Events = {
			FireReminder: 'FireReminder'
		}

		export interface Payload {
			reminderId: string,
		}
	}
}