import type { GameScanConfig } from "@prisma/client";
import { ApplyOptions, RequiresUserPermissions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum, UserError } from "@sapphire/framework";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { ChannelType, ChatInputCommandInteraction, Guild, GuildTextBasedChannel, Message, User } from "discord.js";
import { PuppyBotCommand } from "../../../lib/structures/command/PuppyBotCommand";
import { AWBWScanner, AdvanceWarsByWeb as AWBW } from '../../../lib/structures/managers/games/AWBWScanner'
import { GameRegistryGameListPaginatedMessage } from "../../../lib/structures/message/games/GameRegistryGameListPaginatedMessage";
import { GameRegistryUserEmbed } from "../../../lib/structures/message/games/GameRegistryUserEmbed";
import { GameRegistryUserListPaginatedMessage } from "../../../lib/structures/message/games/GameRegistryUserListPaginatedMessage";

const SHORT_DESCRIPTION = `Configures settings for AdvancedWarsByWeb games.`

@ApplyOptions<PuppyBotCommand.Options>({
	name: 'awbw',
	aliases: ['advance-wars-by-web'],
	description: SHORT_DESCRIPTION,
	requiredClientPermissions: [PermissionFlagsBits.ManageMessages],
	runIn: [CommandOptionsRunTypeEnum.GuildAny],
	subcommands: [
		{
			name: 'add' as AdvanceWarsByWeb.ValidHandler,
			messageRun: 'messageRunAdd',
			type: 'method'
		},
		{
			name: 'admin' as AdvanceWarsByWeb.ValidHandler,
			messageRun: 'messageRunAdmin',
			type: 'method'
		},
		{
			name: 'list' as AdvanceWarsByWeb.ValidHandler,
			messageRun: 'messageRunList',
			type: 'method'
		},
		{
			name: 'remove' as AdvanceWarsByWeb.ValidHandler,
			messageRun: 'messageRunRemove',
			type: 'method'
		},
	]
})
export class AdvanceWarsByWeb extends PuppyBotCommand {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((builder) => builder
			.setName(this.name)
			.setDescription(this.description)
			.addSubcommandGroup((builder) =>
				builder
					.setName('add')
					.setDescription('Adds users or games.')
					.addSubcommand((builder) =>
						builder
							.setName('game')
							.setDescription('Adds a new game ID for tracking.')
							.addStringOption((option) =>
								option
									.setName('game-ids')
									.setDescription('The game ID (or ID\'s) to track.')
									.setRequired(true)
							)
					)
					.addSubcommand((builder) =>
						builder
							.setName('user')
							.setDescription(`Adds a new user registry for AWBW tracking.`)
							.addStringOption((option) =>
								option
									.setName('awbw-user-id')
									.setDescription(`The awbw-user-id which will be matched for turn tracking.`)
									.setRequired(true)
							)
							.addUserOption((option) =>
								option
									.setName(`discord-user`)
									.setDescription(`The discord-user to ping when a turn is ready.`)
							)
					)
			)
			.addSubcommandGroup((builder) =>
				builder
					.setName('remove')
					.setDescription(`Removes users or games.`)
					.addSubcommand((builder) =>
						builder
							.setName('game')
							.setDescription('Removes a game ID (or ID\'s) from racking.')
							.addStringOption((option) =>
								option
									.setName('game-ids')
									.setDescription('The game ID (or ID\'s) to remove.')
									.setRequired(true)
							)
					)
					.addSubcommand((builder) =>
						builder
							.setName('user')
							.setDescription(`Removes a user registry from tracking.`)
							.addUserOption((option) =>
								option
									.setName(`discord-user`)
									.setDescription(`Which Discord user to remove.  Defaults to the invoker.`)
							)
					)
			)
			.addSubcommandGroup((builder) =>
				builder
					.setName('list')
					.setDescription(`Lists all uers or all games.`)
					.addSubcommand((builder) =>
						builder
							.setName('game')
							.setDescription('Lists all games being tracked.')
							.addBooleanOption(option =>
								option
									.setName('show-expired')
									.setDescription('Whether or not to show expired games too. Defaults to false.')
							)
					)
					.addSubcommand((builder) =>
						builder
							.setName('user')
							.setDescription(`Lists all users and their awbw-user-id's.`)
					)
			)
			.addSubcommandGroup((builder) =>
				builder
					.setName('admin')
					.setDescription(`Configuration options for AWBW integration.`)
					.addSubcommand((builder) =>
						builder
							.setName('channel')
							.setDescription('Sets the channel for pinging users.')
							.addChannelOption((option) =>
								option
									.setName('output-channel')
									.setDescription(`The channel notifications will be sent to.`)
									.addChannelTypes(ChannelType.GuildText)
							)
					)
			),
			this.slashCommandOptions
		)
	}

	public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
		const subCommandGroup = interaction.options.getSubcommandGroup(true) as AdvanceWarsByWeb.ValidSubCommandGroup
		const subCommand = interaction.options.getSubcommand(true) as AdvanceWarsByWeb.ValidSubCommand<typeof subCommandGroup>;

		const options = {
			'output-channel': interaction.options.getChannel('output-channel'),
			'game-ids': interaction.options.getString('game-ids')?.split(/\s+/),
			'discord-user': interaction.options.getUser('discord-user'),
			'awbw-user-id': interaction.options.getString('awbw-user-id'),
			'show-expired': interaction.options.getBoolean('show-expired')
		} as AdvanceWarsByWeb.CommandOptions;

		if (subCommandGroup === 'admin' && !interaction.guild!.members.cache.get(interaction.user.id)?.permissions.has('Administrator')) {
			this.error(`You don't have sufficient permissions for this command.`, interaction.user)
		}

		await this.run({
			messageOrInteraction: interaction,
			subCommandGroup: subCommandGroup,
			subCommand: subCommand,
			guild: interaction.guild!,
			user: interaction.user,
			options
		})
	}

	public async messageRunAdd(message: Message, args: Args) {
		if (args.getFlags('user')) {
			const awbwID = args.getOption('awbw-user-id');
			if (!awbwID) this.error(`Could not find awbw-user-id.`, args);

			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'add',
				subCommand: 'user',
				guild: message.guild!,
				user: message.author,
				options: {
					"awbw-user-id": awbwID,
					'discord-user': message.guild!.members.cache.get(args.getOption('discord-user') ?? '')?.user
				}
			});
		} else if (args.getFlags('game')) {
			const gameIDs = await args.restResult('string')
			if (gameIDs.isErr()) this.error(`game-ids were not provided.`, args)

			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'add',
				subCommand: 'game',
				guild: message.guild!,
				user: message.author,
				options: {
					"game-ids": gameIDs.unwrap().split(/\s+/)
				}
			});
		} else {
			this.error(`Invalid flag.  Please use \`add user\` or \`add game\`.`, args.message.content);
		}
	}

	public async messageRunRemove(message: Message, args: Args) {
		if (args.getFlags('user')) {
			const member = message.guild!.members.cache.get(args.getOption('discord-user') ?? '');
			if (!member) this.error(`Could not find discord-user.`, args);

			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'remove',
				subCommand: 'user',
				guild: message.guild!,
				user: message.author,
				options: {
					'discord-user': member.user
				}
			});
		} else if (args.getFlags('game')) {
			const gameIDs = await args.restResult('string')
			if (gameIDs.isErr()) this.error(`game-ids were not provided.`, args)

			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'remove',
				subCommand: 'game',
				guild: message.guild!,
				user: message.author,
				options: {
					"game-ids": gameIDs.unwrap().split(/\s+/)
				}
			});
		} else {
			this.error(`Invalid flag.  Please use \`remove user\` or \`remove game\`.`, args);
		}
	}

	public async messageRunList(message: Message, args: Args) {
		if (args.getFlags('user')) {
			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'list',
				subCommand: 'user',
				guild: message.guild!,
				user: message.author,
				options: {
				}
			});
		} else if (args.getFlags('game')) {
			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'list',
				subCommand: 'game',
				guild: message.guild!,
				user: message.author,
				options: {
					'show-expired': (args.getOption('show-expired')?.toLowerCase() ?? false) === 'true'
				}
			});
		} else {
			this.error(`Invalid flag.  Please use \`list user\` or \`list game\`.`, args);
		}
	}

	@RequiresUserPermissions('Administrator')
	public async messageRunAdmin(message: Message, args: Args) {
		if (args.getFlags('channel')) {
			const channel = message.guild!.channels.cache.get(args.getOption('output-channel') ?? '');
			if (!channel) this.error(`Could not find channel.`, args);

			await this.run({
				messageOrInteraction: message,
				subCommandGroup: 'admin',
				subCommand: 'channel',
				guild: message.guild!,
				user: message.author,
				options: {
					'output-channel': channel as GuildTextBasedChannel
				}
			});
		} else {
			this.error(`Invalid flag.  Please use \`admin channel\`.`, args);
		}
	}

	public async run<G extends AdvanceWarsByWeb.ValidSubCommandGroup, S extends AdvanceWarsByWeb.ValidSubCommand<G>>(args: {
		messageOrInteraction: Message | ChatInputCommandInteraction,
		subCommandGroup: G,
		subCommand: S,
		guild: Guild,
		user: User,
		options: AdvanceWarsByWeb.CommandOptions<G, S>
	}) {
		if (args.subCommandGroup === 'add') {
			if (args.subCommand === 'game') {
				await this.handleAddGame(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'add', 'game'>)
			} else if (args.subCommand === 'user') {
				await this.handleAddUser(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'add', 'user'>)
			} else this.error(`Invalid SubCommand.`, args.subCommand)
		} else if (args.subCommandGroup === 'admin') {
			if (args.subCommand === 'channel') {
				await this.handleAdminChannel(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'admin', 'channel'>)
			} else this.error(`Invalid SubCommand.`, args.subCommand);
		} else if (args.subCommandGroup === 'list') {
			if (args.subCommand === 'game') {
				await this.handleListGame(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'list', 'game'>)
			} else if (args.subCommand === 'user') {
				await this.handleListUser(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'list', 'user'>)
			} else this.error(`Invalid SubCommand.`, args.subCommand);
		} else if (args.subCommandGroup === 'remove') {
			if (args.subCommand === 'game') {
				await this.handleRemoveGame(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'remove', 'game'>)
			} else if (args.subCommand === 'user') {
				await this.handleRemoveUser(args.messageOrInteraction, args.guild, args.user, args.options as AdvanceWarsByWeb.CommandOptions<'remove', 'user'>)
			} else this.error(`Invalid SubCommand.`, args.subCommand);
		} else this.error(`Invalid SubCommand group.`, args.subCommandGroup);
	}

	public async handleAddGame(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, user: User, options: AdvanceWarsByWeb.CommandOptions<'add', 'game'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);
		var caughtErrors: UserError[] = [];
		var registryEntries: AWBW.RegistryRecord.Instance[] = [];
		for (var gameId of options['game-ids']) {
			try {
				const game = await AWBWScanner.generateGameRecord(gameId);
				registryEntries.push(await guild.games.awbw.registerGameId(user, game));
			} catch (e) {
				if (e instanceof UserError) caughtErrors.push(e);
				else throw e;
			}
		}

		if (registryEntries.length === 0) {
			await followUp(`\`${options['game-ids'].join('\`, \`')}\`${options['game-ids'].length > 1 ? ` are` : ` is`} already being tracked.`);
		} else {
			const paginatedMessage = new GameRegistryGameListPaginatedMessage({
				registryEntries,
				guild: guild,
				// template: new EmbedBuilder()
				// 	.setTitle(`Added Game:`)
				// 	.setColor(Colors.Aqua)
			});

			await paginatedMessage.run(messageOrInteraction);
		}
	}

	public async handleAddUser(messageOrInteraction: Message | ChatInputCommandInteraction, _guild: Guild, user: User, options: AdvanceWarsByWeb.CommandOptions<'add', 'user'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);
		const userRecord = await AWBWScanner.generateUserRecord((options['discord-user'] as User ?? user).id, (options['awbw-user-id'] as string))
		await followUp({
			embeds: [
				new GameRegistryUserEmbed({
					userRecords: [userRecord]
				})
			]
		});
	}

	public async handleListGame(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: AdvanceWarsByWeb.CommandOptions<'list', 'game'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		if (guild.games.awbw.gameRegistryEntries.size === 0) {
			await followUp(`No AWBW games are being tracked on this server.  Use the \`awbw add game\` command to add one.`);
		} else {
			const paginatedMessage = new GameRegistryGameListPaginatedMessage({
				guild: guild,
				fetchExpired: options["show-expired"]
			})

			await paginatedMessage.run(messageOrInteraction);
		}
	}

	public async handleListUser(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, _options: AdvanceWarsByWeb.CommandOptions<'list', 'user'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);
		if (guild.games.awbw.users.size === 0) {
			await followUp(`No AWBW users are being tracked on this server.  Use the \`awbw add user\` command to add one.`);
		} else {
			const paginatedMessage = new GameRegistryUserListPaginatedMessage({
				guild
			});

			await paginatedMessage.run(messageOrInteraction);
		}
	}

	public async handleAdminChannel(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: AdvanceWarsByWeb.CommandOptions<'admin', 'channel'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		let config: GameScanConfig;
		if (options["output-channel"]) {
			config = (await guild.games.awbw.setConfig({
				outputChannelId: options["output-channel"].id
			}))!;
		} else {
			config = guild.games.awbw.config!;
		}

		await followUp(`Set output channel for AWBW messages to: ${guild.channels.cache.get(config.outputChannelId ?? '')}`)
	}

	// public async handleAdminInterval(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: AdvanceWarsByWeb.CommandOptions<'admin', 'interval'>) {
	// 	const followUp = await PuppyBotCommand.generateFollowUp(messageOrInteraction);

	// 	let config: GameScanConfig;
	// 	if (options["interval-secs"]) {
	// 		config = (await guild.games.awbw.setConfig({
	// 			intervalSecs: options["interval-secs"]
	// 		}))!;
	// 	} else {
	// 		config = guild.games.awbw.config!;
	// 	}

	// 	await followUp(`Done: ${config.intervalSecs}`)
	// }

	public async handleRemoveGame(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: AdvanceWarsByWeb.CommandOptions<'remove', 'game'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		for (var gameId of options["game-ids"]) {
			const foundGame = guild.games.awbw.games.find((game) => game.gameId === gameId);
			if (foundGame) await guild.games.awbw.unregisterGameId(foundGame);
		}

		await followUp(`No longer tracking AWBW game ID's: \`${options['game-ids'].join('\`, \`')}\``);
	}

	public async handleRemoveUser(messageOrInteraction: Message | ChatInputCommandInteraction, _guild: Guild, user: User, options: AdvanceWarsByWeb.CommandOptions<'remove', 'user'>) {
		const followUp = await this.generateFollowUp(messageOrInteraction);
		const userToRemove = options['discord-user'] as User ?? user
		await AWBWScanner.removeUser(userToRemove.id)
		await followUp(`Removed ${userToRemove}'s AWBW entry.`);
	}
}

export namespace AdvanceWarsByWeb {
	export interface CommandStructure {
		'add': {
			'game': {
				'game-ids': string[]
			},
			'user': {
				'awbw-user-id': string,
				'discord-user'?: User
			}
		},
		'admin': {
			'channel': {
				'output-channel': GuildTextBasedChannel | undefined
			},
		},
		'list': {
			'game': {
				'show-expired': boolean
			},
			'user': PuppyBotCommand.SubCommandNoOptions
		},
		'remove': {
			'game': {
				'game-ids': string[]
			},
			'user': {
				'discord-user': User
			}
		}
	}

	export type ValidSubCommandGroup = PuppyBotCommand.ValidSubCommandGroup<CommandStructure>
	export type ValidSubCommand<G extends ValidSubCommandGroup | undefined = undefined> = PuppyBotCommand.ValidSubCommand<CommandStructure, G>
	export type ValidOption<G extends ValidSubCommandGroup | undefined = undefined, S extends ValidSubCommand<G> | undefined = undefined> = PuppyBotCommand.ValidOption<CommandStructure, G, S>
	export type ValidOptionType<G extends ValidSubCommandGroup | undefined = undefined, S extends ValidSubCommand<G> | undefined = undefined, O extends ValidOption<G, S> | undefined = undefined> = PuppyBotCommand.ValidOptionType<CommandStructure, G, S, O>

	export type ValidHandler = ValidSubCommand;
	// export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
	export type CommandOptions<G extends ValidSubCommandGroup | undefined = undefined, S extends ValidSubCommand<G> | undefined = undefined> = PuppyBotCommand.CommandOptions<CommandStructure, G, S>;
}