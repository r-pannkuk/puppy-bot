import { container, UserError } from "@sapphire/framework";
import prettyMilliseconds from "pretty-ms";
import { ButtonInteraction, Constants, ExcludeEnum, Message, MessageButtonOptions, MessageEmbedOptions } from "discord.js";
import { ReminderCommand } from "../../../../commands/reminders/Reminder";
import { Emojis } from "../../../utils/constants";
import type { ReminderManager } from "../../managers/ReminderManager";
import { PuppyBotEmbed } from "../PuppyBotEmbed";
import { Duration } from "@sapphire/time-utilities";

export enum _InteractionIds {
	Remove = `ReminderEmbed.remove`,
	// Edit = 'ReminderEmbed.edit',
	RepeatMany = `ReminderEmbed.repeatMany`,
	Reschedule = `ReminderEmbed.reschedule`,
	Subscribe = `ReminderEmbed.subscribe`,
	Unsubscribe = `ReminderEmbed.unsubscribe`,
}

export const InteractionIds = { ..._InteractionIds }

export class ReminderEmbed extends PuppyBotEmbed {
	protected reminderId: string | undefined;
	public get reminder() {
		return container.client.reminders.cache.get(this.reminderId!);
	}

	public get currentSchedule() {
		return this.reminder?.getActiveSchedule();
	}

	public static actions: (MessageButtonOptions & { customId: string, run: (interaction: ButtonInteraction, reminder: ReminderManager.Reminder.Instance) => any })[] = [
		{
			customId: InteractionIds.Remove,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.CrossMark,
			style: Constants.MessageButtonStyles.DANGER as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, reminder) => {
				if(!reminder) {
					await interaction.reply(`Reminder has already been removed.`);
					return;
				}
				reminder = container.client.reminders.cache.get(reminder.id)!;

				if (reminder.isDisabled) {
					await interaction.reply(`Reminder has already been removed.`);
					return;
				} else {
					if (!interaction.replied) {
						await interaction.deferReply();
					}
					await container.client.reminders.stopReminder(reminder, {
						guildId: interaction.guildId,
						channelId: interaction.channelId,
						messageId: interaction.message.id,
					});

					await interaction.editReply(`Removed reminder.`);
				}
			}
		},
		// {
		// 	customId: InteractionIds.Edit,
		// 	type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
		// 	emoji: Emojis.Pencil,
		// 	style: Constants.MessageButtonStyles.LINK as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
		// 	run: async (interaction, reminder) => {
		//   	reminder = container.client.reminders.cache.get(reminder.id)!;
		// 		await interaction.deferReply();
		// 		await container.client.reminders.(reminder, {
		// 			guildId: interaction.guildId,
		// 			channelId: interaction.channelId,
		// 			messageId: interaction.message.id,
		// 		});

		// 		await interaction.editReply(`Removed reminder.`);
		// 	}
		// },
		{
			customId: InteractionIds.RepeatMany,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.RepeatInfinite,
			style: Constants.MessageButtonStyles.PRIMARY as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, reminder) => {
				reminder = container.client.reminders.cache.get(reminder.id)!;

				await interaction.reply({
					content: `Please enter an interval (e.g. \`1d 6h\`) for repeating.`,
				});

				interaction.channel?.createMessageCollector({
					filter: (message) => {
						if (message.author.id !== interaction.user.id) return false;
						try {
							return ReminderCommand.parseTime(message.content) instanceof Date;
						} catch (e) {
							if (e instanceof UserError) {
								return false;
							} else throw e;
						}
					},
					max: 1,
					dispose: true,
				}).addListener('collect', async (message: Message) => {
					reminder = container.client.reminders.cache.get(reminder.id)!;
					const duration = new Duration(message.content);
					const currentSchedule = reminder.getActiveSchedule() ?? reminder.schedules.last()!;
					const updatedReminder = await container.client.reminders.rescheduleReminder(reminder, {
						...currentSchedule,
						repeat: {
							isRepeating: true,
							isInfinite: true,
							interval: BigInt(duration.offset),
						}
					}, {
						guildId: interaction.guildId,
						channelId: interaction.channelId,
						messageId: interaction.message.id,
					});

					await interaction.followUp(`Set to fire at \`${new Date(updatedReminder!.getActiveSchedule()!.getNextInstance().getTime())}\` and repeat every \`${prettyMilliseconds(duration.offset)}\``);

					const originalMessage = message.channel.messages.cache.get(interaction.message.id)!
					await originalMessage.edit({
						embeds: [
							new ReminderEmbed({
								title: originalMessage.embeds[0].title!,
								reminder: updatedReminder!,
							})
						]
					})
				})
			}
		},
		{
			customId: InteractionIds.Reschedule,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.Timer,
			style: Constants.MessageButtonStyles.PRIMARY as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, reminder) => {
				reminder = container.client.reminders.cache.get(reminder.id)!;

				await interaction.reply({
					content: `Please enter a duration (e.g. \`1d 6h\`) or a date (e.g. \`January 1st\`) for rescheduling.`,
				});

				interaction.channel?.createMessageCollector({
					filter: (message) => {
						if (message.author.id !== interaction.user.id) return false;
						try {
							return ReminderCommand.parseTime(message.content) instanceof Date;
						} catch (e) {
							if (e instanceof UserError) {
								return false;
							} else throw e;
						}
					},
					max: 1,
					dispose: true,
				}).addListener('collect', async (message: Message) => {
					reminder = container.client.reminders.cache.get(reminder.id)!;
					const parsedDate = ReminderCommand.parseTime(message.content);
					const currentSchedule = reminder.getActiveSchedule()!;
					const updatedReminder = await container.client.reminders.rescheduleReminder(reminder, {
						...currentSchedule,
						reminderTime: parsedDate
					}, {
						guildId: interaction.guildId,
						channelId: interaction.channelId,
						messageId: interaction.message.id,
					});

					await interaction.followUp(`Set to fire at \`${new Date(updatedReminder!.getActiveSchedule()!.getNextInstance().getTime())}\``);
					
					const originalMessage = message.channel.messages.cache.get(interaction.message.id)!
					await originalMessage.edit({
						embeds: [
							new ReminderEmbed({
								title: originalMessage.embeds[0].title!,
								reminder: updatedReminder!,
							})
						]
					})
				})
			}
		},
		{
			customId: InteractionIds.Subscribe,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.PlusSign,
			style: Constants.MessageButtonStyles.SUCCESS as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, reminder) => {
				reminder = container.client.reminders.cache.get(reminder.id)!;

				await interaction.deferReply();

				await container.client.reminders.subscribeToReminder(reminder, interaction.user, {
					guildId: interaction.guildId,
					channelId: interaction.channelId,
					messageId: interaction.message.id,
				});

				await interaction.editReply(`Added ${interaction.user} to the reminder.`);
			}
		},
		{
			customId: InteractionIds.Unsubscribe,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.MinusSign,
			style: Constants.MessageButtonStyles.SECONDARY as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, reminder) => {
				reminder = container.client.reminders.cache.get(reminder.id)!;

				await interaction.deferReply();

				await container.client.reminders.unsubscribeToReminder(reminder, interaction.user, {
					guildId: interaction.guildId,
					channelId: interaction.channelId,
					messageId: interaction.message.id,
				});

				await interaction.editReply(`Removed ${interaction.user} from the reminder.`);
			}
		},
	]

	public constructor(options: ReminderEmbed.Options) {
		super(options);

		if (options && options.reminder) {
			this.reminderId = options.reminder.id;
		}

		this.update(options?.state);
		var footer = `ID: ${this.reminder?.id} | Author: ${this.reminder?.getOwner().username} | Reminded ${(this.reminder?.getExecutionNumber() ?? 0)} times`;

		if (this.currentSchedule?.repeat.isRepeating) {
			footer += ` | `;
		}

		this.setFooter({
			text: footer
		});
	}

	public update(state?: ReminderEmbed.State | null) {
		this.setFields([]);
		this.description = ``;

		if (!state) {
			if (this.reminder?.isDisabled) {
				state = 'REMOVED';
			} else if (this.reminder?.getIsPending()) {
				state = 'PENDING';
			} else if (this.reminder) {
				state = 'FIRED';
			}

		}

		var content: string[] = [];

		if (state === 'REMOVED') {
			this.setColor(Constants.Colors.DARK_RED);
			this.setTitle(`${Emojis.CrossMarkRed} Removed Reminder`);
		} else if (state === 'PENDING') {
			this.setColor(Constants.Colors.DARK_PURPLE);
			this.setTitle(`${Emojis.Timer} Upcoming Reminder`);
		} else if (state === 'FIRED') {
			this.setColor(Constants.Colors.DARK_GREY);
			this.setTitle(`Reminder`);
		}

		content.push(`**State**: \`${state}\``);
		content.push(`**Scheduled**: \`${this.reminder?.schedules.last()?.reminderTime}\``);

		if (this.currentSchedule?.repeat.isRepeating) {
			content.push(`**Repeat**: ${prettyMilliseconds(Number(this.currentSchedule?.repeat.interval))}`);
		}
		content.push(``);
		content.push(this.reminder?.content ?? `undefined`);

		this.splitFields({
			content
		});

		return this;
	}
}

export namespace ReminderEmbed {
	export type Options = MessageEmbedOptions & {
		reminder: ReminderManager.Reminder.Instance,
		state?: State,
	}

	export type State = 'REMOVED' | 'PENDING' | 'FIRED';
}