import { PaginatedMessage, PaginatedMessageAction, PaginatedMessageMessageOptionsUnion, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { ButtonInteraction, CacheType, Constants, MessageEmbed } from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { Emojis } from "../../../utils/constants";
import { ReminderEmbed } from "./ReminderEmbed";

export enum _InteractionIds {
	PreviousPage = 'ListReminderPaginatedMessage.previousPage',
	NextPage = 'ListReminderPaginatedMessage.nextPage',
	GoToPage = 'ListReminderPaginatedMessage.goToPage'
}

export const InteractionIds = { ..._InteractionIds };

export class ListReminderPaginatedMessage extends PaginatedMessage {
	protected ownerId: string | undefined;
	protected showAll: boolean = false;
	public get owner() {
		return container.client.users.cache.get(this.ownerId!)!;
	}
	public readonly cachedReminderIds : string[];
	public get reminders() {
		var reminders = container.client.reminders.cache.filter((reminder) =>
			(this.cachedReminderIds && this.cachedReminderIds.includes(reminder.id)) || 
			!reminder.isDisabled && (
				reminder.target.mentionableIds.includes(this.ownerId ?? `null`) ||
				reminder.ownerId === this.ownerId
			)
		);

		if (!this.showAll) {
			var filtered = reminders.filter((reminder) => (this.cachedReminderIds && this.cachedReminderIds.includes(reminder.id)) || reminder.getIsPending());

			if (reminders.size > 0) {
				reminders = filtered;
			}
		}

		return reminders.sort((a, b) => {
			const aSchedule = a.getActiveSchedule() ?? a.schedules.last()!;
			const bSchedule = b.getActiveSchedule() ?? b.schedules.last()!;

			if (bSchedule.getNextInstance().getTime() > Date.now()) {
				if (aSchedule.getNextInstance().getTime() > Date.now()) {
					return bSchedule.getNextInstance().getTime() - aSchedule.getNextInstance().getTime();
				} else {
					return -1 * bSchedule.getNextInstance().getTime();
				}
			} else if (aSchedule.getNextInstance().getTime() > Date.now()) {
				return -1 * aSchedule.getNextInstance().getTime();
			} else {
				return bSchedule.getNextInstance().getTime() - aSchedule.getNextInstance().getTime();
			}
		});
	}

	public constructor(options: ListReminderPaginatedMessage.Options) {
		super({
			...options,
			actions: options.actions ?? [
				{
					customId: InteractionIds.PreviousPage,
					style: 'PRIMARY',
					emoji: Emojis.ArrowLeft,
					type: Constants.MessageComponentTypes.BUTTON,
					run: ({ handler }) => {
						if (handler.index === 0) {
							handler.index = handler.pages.length - 1;
						} else {
							--handler.index;
						}

						((handler.messages[handler.index] as PaginatedMessageMessageOptionsUnion).embeds?.at(0) as ReminderEmbed).update();
						this.generateSelectMenu();
					}
				},
				{
					customId: InteractionIds.NextPage,
					style: 'PRIMARY',
					emoji: Emojis.ArrowRight,
					type: Constants.MessageComponentTypes.BUTTON,
					run: ({ handler }) => {
						if (handler.index === handler.pages.length - 1) {
							handler.index = 0;
						} else {
							++handler.index;
						}

						((handler.messages[handler.index] as PaginatedMessageMessageOptionsUnion).embeds?.at(0) as ReminderEmbed).update();
						this.generateSelectMenu();
					}
				},
			]
		})

		if (options && options.ownerId) {
			this.ownerId = options.ownerId;
		}
		if (options && options.showAll) {
			this.showAll = options.showAll;
		}

		this.cachedReminderIds = Array.from(this.reminders.keys());

		this.addAction({
			customId: InteractionIds.GoToPage,
			type: Constants.MessageComponentTypes.SELECT_MENU,
			run: ({ handler, interaction }) => {
				if (interaction.isSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10);
					((handler.messages[handler.index] as PaginatedMessageMessageOptionsUnion).embeds?.at(0) as ReminderEmbed).update();
					this.generateSelectMenu();
				}
			}
		});

		this.addActions(ReminderEmbed.actions.map((action) => ({
			...action,
			run: ({ handler, interaction }) => {
				action.run(interaction as ButtonInteraction<CacheType>, this.reminders.at(handler.index)!);
				((handler.messages[handler.index] as PaginatedMessageMessageOptionsUnion).embeds?.at(0) as ReminderEmbed).update();
				this.generateSelectMenu();
			}
		})) as PaginatedMessageAction[]);

		this.generatePages();
		this.generateSelectMenu();
	}

	public generateSelectMenu() {
		this.setSelectMenuOptions((pageIndex) => {
			var reminder = this.reminders.at(pageIndex - 1);

			if (!reminder) {
				return {
					label: `NOT_FOUND`
				}
			}

			let description: string;
			if (reminder.getIsPending()) {
				description = `${prettyMilliseconds(reminder.getActiveSchedule()!.getNextInstance().getTime() - Date.now())}`;
			} else {
				description = `${reminder.schedules.last()!.reminderTime}`;
			}

			var emoji: string | undefined = undefined;
			if (reminder.isDisabled) {
				emoji = Emojis.CrossMarkRed;
			} else if (reminder.getIsPending()) {
				emoji = Emojis.Timer;
			}

			return {
				emoji,
				label: `${reminder.content}${reminder.content.length > 20 ? `...` : ``}`,
				description,
			};

		});
	}

	public generatePages() {
		if (this.reminders.size > 0) {
			for (var [_, reminder] of this.reminders) {
				this.addPageEmbed(new ReminderEmbed({
					reminder
				}));
			}
		} else {
			this.addPageEmbed(new MessageEmbed({
				title: `ERROR: No reminders found.`,
				description: `No reminders were found for this user.`,
				color: Constants.Colors.DARK_RED,
			}))
		}
	}
}

export namespace ListReminderPaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		ownerId: string,
		showAll: boolean,
	}
}