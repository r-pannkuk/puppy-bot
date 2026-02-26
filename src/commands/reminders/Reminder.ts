/**
 * @file Reminder.ts
 * @description `/reminder` command — creates and lists scheduled reminders.
 *
 * Subcommands:
 * - `create <when> <content> [mention] [location]`
 *     Creates a new reminder.  `when` is parsed first as a Sapphire `Duration`
 *     string (e.g., `2h30m`), then as a natural-language date via `chrono-node`
 *     (e.g., `next Monday at 9am`).
 *     `mention` can be a user or a role; `location` overrides the target channel.
 * - `list`  — shows all your reminders in a paginated, interactive embed.
 *
 * All reminder data is stored in MongoDB via {@link ReminderManager}.  Scheduled
 * firing is handled by the `FireReminder` Bull task.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { container, ApplicationCommandRegistry, Args, ChatInputCommandContext, UserError } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ChannelType, ChatInputCommandInteraction, Guild, GuildMember, GuildTextBasedChannel, Message, PermissionFlagsBits, Role, User } from 'discord.js';
import { Duration } from '@sapphire/time-utilities';
import * as chrono from 'chrono-node';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';
import { ReminderManager } from '../../lib/structures/managers/ReminderManager';
import type { ValidTarget } from '../../lib/structures/managers/ReminderManager';
import { ReminderEmbed, InteractionIds } from '../../lib/structures/message/reminder/ReminderEmbed';
import { ListReminderPaginatedMessage } from '../../lib/structures/message/reminder/ListReminderPaginatedMessage';
import { ReminderTargetType } from '@prisma/client';
import { getDefaultTimezone } from '../../lib/utils/constants';

const SHORT_DESCRIPTION = 'Creates and lists scheduled reminders.';

@ApplyOptions<PuppyBotCommand.Options>({
	name: 'reminder',
	description: SHORT_DESCRIPTION,
	requiredClientPermissions: [PermissionFlagsBits.ManageMessages],
	subcommands: [
		{
			name: 'create',
			messageRun: 'messageRunCreate',
			type: 'method',
			default: true,
		},
		{
			name: 'list',
			messageRun: 'messageRunList',
			type: 'method'
		},
	]
})
export class ReminderCommand extends PuppyBotCommand {
	public static parseTime(input: string) {
		let parsed = new Duration(input).fromNow;

		if (!parsed || isNaN(parsed.getTime()) || parsed <= new Date(Date.now())) {
			parsed = chrono.parseDate(input, {
				timezone: getDefaultTimezone()
			}) ?? new Date(input);
		}

		if (!parsed || isNaN(parsed.getTime()) || parsed <= new Date(Date.now())) throw new UserError({ identifier: `Could not parse reminder time.`, context: input });

		return parsed;
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
			.setName(this.name)
			.setDescription(this.description)
			.addSubcommand((builder) =>
				builder
					.setName('create')
					.setDescription('Creates a new reminder.')
					.addStringOption((option) =>
						option
							.setName('when')
							.setDescription('When the reminder should go off.')
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('content')
							.setDescription('What content should be sent with the reminder.')
							.setRequired(true)
					)
					.addMentionableOption((option) =>
						option
							.setName('mention')
							.setDescription('Who should be notified when this reminder goes off. Defaults to invoker.')
					)
					.addChannelOption((option) =>
						option
							.setName('location')
							.setDescription('Where the reminder should go off.  Defaults to DMing the user or the channel.')
							.addChannelTypes(ChannelType.GuildText)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('list')
					.setDescription('Lists all available reminders.')
					.addBooleanOption(option =>
						option
							.setName('show-all')
							.setDescription('Show all reminders across all users you can see.  Defaults to false.')
					)
			),
			this.slashCommandOptions
		)
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
		const subCommand = interaction.options.getSubcommand(true) as Remind.ValidSubCommand;
		let mention: string | User | GuildMember | Role | null | undefined = interaction.options.getMentionable('mention') as string | User | GuildMember | Role;
		if (!mention) {
			mention = container.client.users.cache.get(interaction.user.id);
		};

		const options = {
			'location': interaction.options.getChannel('location'),
			'mention': mention,
			'when': interaction.options.getString('when'),
			'content': interaction.options.getString('content'),
			'show-all': interaction.options.getBoolean('show-all'),
		} as Remind.CommandOptions<'create' | 'list'>

		await this.run({
			messageOrInteraction: interaction,
			subCommand: subCommand,
			guild: interaction.guild,
			user: interaction.user,
			options
		})
	}

	public async messageRunCreate(message: Message, args: Args) {
		let mention: string | User | GuildMember | Role | null | undefined = args.getOption('mention');
		if (mention) {
			mention = message.guild?.members.cache.get(mention) ??
				message.guild?.roles.cache.get(mention) ??
				container.client.users.cache.get(mention);
		}
		const options = {
			location: (message.guild) ? message.guild.channels.cache.get(args.getOption('location') ?? message.channelId) : message.channel,
			mention,
			when: args.getOption('when')!,
			content: args.getOption('content')!,
		} as Remind.CommandOptions<'create'>;

		await this.run({
			messageOrInteraction: message,
			subCommand: 'create',
			user: message.author,
			guild: message.guild,
			options,
		})
	}

	public async messageRunList(message: Message, args: Args) {
		const options = {
			"show-all": args.getOption('show-all')?.toLowerCase() === 'true'
		} as Remind.CommandOptions<'list'>

		await this.run({
			messageOrInteraction: message,
			subCommand: 'list',
			user: message.author,
			guild: message.guild,
			options,
		})
	}

	public async run<S extends Remind.ValidSubCommand>(args: {
		messageOrInteraction: Message | ChatInputCommandInteraction,
		subCommand: S,
		guild?: Guild | null,
		user: User,
		options: Remind.CommandOptions<S>
	}) {
		if (args.subCommand === 'create') {
			await this.handleCreate(args.messageOrInteraction, args.guild, args.user, args.options as Remind.CommandOptions<'create'>)
		} else if (args.subCommand === 'list') {
			await this.handleList(args.messageOrInteraction, args.guild, args.user, args.options as Remind.CommandOptions<'list'>)
		} else this.error(`Invalid SubCommand.`, args)
	}

	public static async executeFollowUp(followUp: (options) => Promise<Message<boolean>>, reminder: ReminderManager.Reminder.Instance, user: User, options?: Omit<ReminderEmbed.Options, 'reminder'> | null) {
		const _actionRow1: string[] = [InteractionIds.Remove, InteractionIds.Reschedule, InteractionIds.RepeatMany];
		const _actionRow2: string[] = [InteractionIds.Subscribe, InteractionIds.Unsubscribe]

		const actionRow1 = new ActionRowBuilder()
			.addComponents(
				_actionRow1.map(id => {
					const action = ReminderEmbed.actions.find(action => action.customId === id)!;
					return new ButtonBuilder({
						custom_id: action.customId,
						disabled: action.disabled,
						label: action.label,
						style: action.style,
						emoji: {
							name: action.emoji?.toString(),
						},
					})
				})
			)
		const actionRow2 = new ActionRowBuilder()
			.addComponents(
				_actionRow2.map(id => {
					const action = ReminderEmbed.actions.find(action => action.customId === id)!;
					return new ButtonBuilder({
						custom_id: action.customId,
						disabled: action.disabled,
						label: action.label,
						style: action.style,
						emoji: {
							name: action.emoji?.toString(),
						},
					})
				})
			)

		if (actionRow1.components.length !== _actionRow1.length || actionRow1.components.some((action) => action === undefined)) {
			throw new UserError({ identifier: `Could not generate actions.`, context: _actionRow1 });
		}
		if (actionRow2.components.length !== _actionRow2.length || actionRow2.components.some((action) => action === undefined)) {
			throw new UserError({ identifier: `Could not generate actions.`, context: _actionRow2 });
		}

		const message = await followUp({
			embeds: [
				new ReminderEmbed({
					...options,
					reminder,
				})
			],
			components: [
				actionRow1,
				actionRow2
			]
		});
		message.createMessageComponentCollector({
			filter: (interaction) => ReminderEmbed.actions.map(a => a.customId).includes(interaction.customId)
		})
			.addListener('collect', async (interaction: ButtonInteraction) => {
				if (interaction.user.id !== user.id) {
					if (_actionRow1.includes(interaction.customId)) {
						await interaction.reply({
							ephemeral: true,
							content: `This action is not available to you, only to the command instigator.`
						});
						return;
					}
				}
				await ReminderEmbed.actions.find((action) => action.customId === interaction.customId)?.run(interaction, reminder);
				await message.edit({
					embeds: [new ReminderEmbed({
						...options,
						reminder,
					})]
				})
			});

		return message;
	}

	public async handleCreate(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild | null | undefined, user: User, options: Remind.CommandOptions<'create'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const parsed = ReminderCommand.parseTime(options.when);

		let target: ValidTarget;

		if (options.location) {
			if (options.mention) {
				const type = (options.mention instanceof Role) ? ReminderTargetType.Role : ReminderTargetType.User;
				target = {
					type,
					mentionableIds: [options.mention.id],
					channelId: options.location.id,
					guildId: options.location.guildId,
				}
			} else {
				target = {
					type: ReminderTargetType.Channel,
					mentionableIds: [user.id],
					channelId: options.location.id,
					guildId: options.location.guildId,
				}
			}
		} else {
			if (options.mention instanceof Role) {
				target = {
					type: ReminderTargetType.Role,
					mentionableIds: [options.mention.id],
					guildId: guild!.id,
					channelId: messageOrInteraction.channelId,
				}
			} else if (options.mention instanceof User || options.mention instanceof GuildMember) {
				target = {
					type: ReminderTargetType.User,
					mentionableIds: [options.mention.id],
					channelId: (await options.mention.createDM()).id,
				}
			} else {
				target = {
					type: ReminderTargetType.User,
					mentionableIds: [user.id],
					channelId: (await user.createDM()).id,
				}
			}
		}


		const reminder = await container.client.reminders.createReminder({
			schedule: {
				reminderTime: parsed,
			},
			location: {
				channelId: messageOrInteraction.channelId,
				guildId: messageOrInteraction.guildId,
				messageId: messageOrInteraction.id,
			},
			ownerId: user.id,
			target,
			content: options.content,
		});

		await ReminderCommand.executeFollowUp(followUp, reminder, user, {
			title: `New Reminder Created`
		});
	}

	public async handleList(messageOrInteraction: Message | ChatInputCommandInteraction, _guild: Guild | null | undefined, user: User, options: Remind.CommandOptions<'list'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);
		const paginatedMessage = new ListReminderPaginatedMessage({
			ownerId: user.id,
			showAll: options["show-all"] ?? false,
		});

		/* Check if anything to show */
		if(paginatedMessage.reminders.size === 1) {
			await ReminderCommand.executeFollowUp(followUp, paginatedMessage.reminders.first()!, user);
		} else {
			await paginatedMessage.run(messageOrInteraction, user);
		}
	}
}

export namespace Remind {
	export interface CommandStructure extends PuppyBotCommand.CommandStructure {
		'create': {
			'mention': User | GuildMember | Role | undefined,
			'location': GuildTextBasedChannel | undefined
			'when': string,
			'content': string,
		},
		'list': {
			'show-all': boolean | undefined
		},
	}

	export type ValidSubCommand = PuppyBotCommand.ValidSubCommand<CommandStructure>
	export type ValidOption<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.ValidOption<CommandStructure, undefined, S>
	export type ValidOptionType<S extends ValidSubCommand | undefined = undefined, O extends ValidOption<S> | undefined = undefined> = PuppyBotCommand.ValidOptionType<CommandStructure, undefined, S, O>

	export type ValidHandler = ValidSubCommand;
	// export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
	export type CommandOptions<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.CommandOptions<CommandStructure, undefined, S>;
}