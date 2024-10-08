import { PaginatedMessage, PaginatedMessageAction, PaginatedMessageMessageOptionsUnion, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { ButtonInteraction, ButtonStyle, CacheType, Collection, Colors, ComponentType, SelectMenuComponentOptionData } from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { Emojis, SELECT_MENU_OPTION_LIMIT } from "../../../utils/constants";
import type { ReminderManager } from "../../managers/ReminderManager";
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
	public readonly cachedReminderIds: string[];
	public get reminders(): Collection<string, ReminderManager.Reminder.Instance> {
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
					return aSchedule.getNextInstance().getTime() - bSchedule.getNextInstance().getTime();
				} else {
					return bSchedule.getNextInstance().getTime();
				}
			} else if (aSchedule.getNextInstance().getTime() > Date.now()) {
				return aSchedule.getNextInstance().getTime();
			} else {
				return aSchedule.getNextInstance().getTime() - bSchedule.getNextInstance().getTime();
			}
		});
	}

	public constructor(options: ListReminderPaginatedMessage.Options) {
		super({
			...options,
			actions: options.actions ?? [
				{
					customId: InteractionIds.PreviousPage,
					style: ButtonStyle.Primary,
					emoji: Emojis.ArrowLeft,
					type: ComponentType.Button,
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
					style: ButtonStyle.Primary,
					emoji: Emojis.ArrowRight,
					type: ComponentType.Button,
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
			type: ComponentType.StringSelect,
			options: this.cachedReminderIds.slice(0, 25).map((_, i) => this.generateMenuOption(i + 1)),
			run: ({ handler, interaction }) => {
				if (interaction.isStringSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10) - 1;
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

	public generateMenuOption(pageIndex : number) {
		var reminder = this.reminders.at(pageIndex - 1);

		if (!reminder) {
			return {
				value: 'NOT_FOUND',
				default: true,
				description: `NOT_FOUND`,
				label: `NOT_FOUND`,
				emoji: undefined,
			} as SelectMenuComponentOptionData;
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
			value: pageIndex.toString(),
			label: reminder.content.length > 20 ? `${reminder.content.slice(0, 20)}...` : reminder.content,
			description,
		} as SelectMenuComponentOptionData;
	}

	public generateSelectMenu() {
		this.setSelectMenuOptions(this.generateMenuOption);
	}

	public generatePages() {
		if (this.reminders.size > 0) {
			for (var [_, reminder] of Array.from(this.reminders.entries()).slice(0, SELECT_MENU_OPTION_LIMIT)) {
				this.addPageEmbed(new ReminderEmbed({
					reminder
				}));
			}
		} else {
			this.addPageEmbed((embed) => {
				return embed.setTitle(`ERROR: No reminders found.`)
					.setDescription(`No reminders were found for this user.`)
					.setColor(Colors.DarkRed);
			})
		}
	}
}

export namespace ListReminderPaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		ownerId: string,
		showAll: boolean,
	}
}