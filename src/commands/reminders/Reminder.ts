import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, container, UserError } from "@sapphire/framework";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { CommandInteraction, User, GuildTextBasedChannel, Constants, Role, GuildMember, Message, Guild, ButtonInteraction, MessageActionRow, MessageButton, MessagePayload, ReplyMessageOptions } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Duration } from '@sapphire/time-utilities'
import { ReminderTargetType } from "@prisma/client";
import * as chrono from 'chrono-node';
import type { ReminderManager, ValidTarget } from "../../lib/structures/managers/ReminderManager";
import { InteractionIds, ReminderEmbed } from "../../lib/structures/message/reminder/ReminderEmbed";
import { ListReminderPaginatedMessage } from "../../lib/structures/message/reminder/ListReminderPaginatedMessage";
import { DEFAULT_TIMEZONE } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = `Set a reminder to go off later.`

@ApplyOptions<PuppyBotCommand.Options>({
	name: 'reminder',
	description: SHORT_DESCRIPTION,
	requiredClientPermissions: [PermissionFlagsBits.ManageMessages],
	subCommands: [
		{
			input: 'create',
			output: 'messageRunCreate',
			type: 'method',
			default: true,
		},
		{
			input: 'list',
			output: 'messageRunList',
			type: 'method'
		},
	]
})
export class ReminderCommand extends PuppyBotCommand {
	public static parseTime(input: string) {
		var parsed = new Duration(input).fromNow;

		if (!parsed || isNaN(parsed.getTime()) || parsed <= new Date(Date.now())) {
			parsed = chrono.parseDate(input, {
				timezone: DEFAULT_TIMEZONE
			});
		}

		if (!parsed || isNaN(parsed.getTime()) || parsed <= new Date(Date.now())) throw new UserError({ identifier: `Could not parse reminder time.`, context: input });

		return parsed;
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		this.registerSlashCommand(registry, new SlashCommandBuilder()
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
							.addChannelType(Constants.ChannelTypes.GUILD_TEXT.valueOf())
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
			)
		)
	}

	public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
		const subCommand = interaction.options.getSubcommand(true) as Remind.ValidSubCommand;
		var mention: string | User | GuildMember | Role | null | undefined = interaction.options.getMentionable('mention') as string | User | GuildMember | Role;
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
		var mention: string | User | GuildMember | Role | null | undefined = args.getOption('mention');
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
		messageOrInteraction: Message | CommandInteraction,
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

	public static async executeFollowUp(followUp: (options: string | MessagePayload | ReplyMessageOptions) => Promise<Message<boolean>>, reminder: ReminderManager.Reminder.Instance, user: User, options?: Omit<ReminderEmbed.Options, 'reminder'> | null) {
		const _actionRow1: string[] = [InteractionIds.Remove, InteractionIds.Reschedule, InteractionIds.RepeatMany];
		const _actionRow2: string[] = [InteractionIds.Subscribe, InteractionIds.Unsubscribe]

		const actionRow1 = new MessageActionRow()
			.addComponents(
				_actionRow1.map(id => new MessageButton(ReminderEmbed.actions.find(action => action.customId === id)!))
			)
		const actionRow2 = new MessageActionRow()
			.addComponents(
				_actionRow2.map(id => new MessageButton(ReminderEmbed.actions.find(action => action.customId === id)!))
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

	public async handleCreate(messageOrInteraction: Message | CommandInteraction, guild: Guild | null | undefined, user: User, options: Remind.CommandOptions<'create'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		var parsed = ReminderCommand.parseTime(options.when);

		var target: ValidTarget;

		if (options.location) {
			if (options.mention) {
				var type = (options.mention instanceof Role) ? ReminderTargetType.Role : ReminderTargetType.User;
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

	public async handleList(messageOrInteraction: Message | CommandInteraction, _guild: Guild | null | undefined, user: User, options: Remind.CommandOptions<'list'>) {
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