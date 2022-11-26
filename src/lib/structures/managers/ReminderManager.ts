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
import { Collection, DMChannel, GuildMember, GuildTextBasedChannel, MessageOptions, MessagePayload, Role, User } from "discord.js";
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
		//TODO: This doesn't resolve with a bullJob that clears on finish
		const getJob = () => container.tasks.get(reminder.jobId);

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

	public async loadData() {
		var loadedReminders = await container.database.reminder.findMany({
			include: {
				events: true,
				schedules: true,
			}
		});

		for (var reminder of loadedReminders) {
			this._cache.set(reminder.id, this._instantiateReminder(reminder));
		}
	}

	private async scheduleReminder(reminder: ReminderManager.Reminder.Instance) : Promise<Job | null> {
		const schedule = reminder.getActiveSchedule();

		if (!schedule) return null;

		const delay = schedule.getNextInstance().getTime() - Date.now();

		let duration = {
			repeated: false,
			delay,
			customJobOptions: {
				removeOnComplete: true,
			} as JobOptions
		} as ScheduledTasksTaskOptions;

		if (schedule.repeat.isRepeating) {
			const interval = Number(schedule.repeat.interval);
			duration.customJobOptions.repeat = {
				every: interval,
			} as Bull.RepeatOptions

			if (!schedule.repeat.isInfinite) {
				(duration.customJobOptions as JobOptions).repeat!.limit = 1;
			}
		}

		return await container.tasks.create(
			"Reminder_FireReminder",
			{
				reminderId: reminder.id,
			} as ReminderManager.ScheduledTask.Payload,
			duration
		) as Job;
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

		const returnedJob = await this.scheduleReminder(instantiatedReminder);

		if(!returnedJob) {
			throw new UserError({identifier: 'Invalid Schedule', context: returnedJob});
		}

		instantiatedReminder.jobId = returnedJob.id.toString();

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
			(options: string | MessagePayload | MessageOptions) => target.send(options),
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

		const returnedJob = await this.scheduleReminder(instantiatedReminder);

		if(!returnedJob) {
			throw new UserError({identifier: 'Invalid Schedule', context: returnedJob});
		}

		instantiatedReminder.jobId = returnedJob.id.toString().split(':')[1];

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
			getJob(): Promise<Job>,
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