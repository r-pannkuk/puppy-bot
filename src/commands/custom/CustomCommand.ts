import { SlashCommandBuilder } from "@discordjs/builders";
import type { CustomCommand } from "@prisma/client";
import { ApplyOptions, RequiresUserPermissions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import { PermissionFlagsBits } from "discord-api-types/v9";
import { ButtonInteraction, CommandInteraction, Guild, Message, MessageActionRow, MessageButton, MessagePayload, ReplyMessageOptions, User } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { CustomCommandEmbed } from "../../lib/structures/message/customCommands/CustomCommandEmbed";
import { CustomCommandListPaginatedMessage } from "../../lib/structures/message/customCommands/CustomCommandListPaginatedMessage";

const SHORT_DESCRIPTION = `Manage server custom commands.`

@ApplyOptions<PuppyBotCommand.Options>({
	aliases: ['cc', 'custom', 'custom-command'],
	name: 'customcommand',
	description: SHORT_DESCRIPTION,
	requiredClientPermissions: [PermissionFlagsBits.ManageMessages],
	runIn: [CommandOptionsRunTypeEnum.GuildAny],
	subCommands: [
		{
			input: 'add',
			output: 'messageRunAdd',
			type: 'method',
		},
		{
			input: 'alias',
			output: 'messageRunAlias',
			type: 'method',
		},
		{
			input: 'remove',
			output: 'messageRunRemove',
			type: 'method',
		},
		{
			input: 'edit',
			output: 'messageRunEdit',
			type: 'method',
		},
		{
			input: 'rename',
			output: 'messageRunRename',
			type: 'method',
		},
		{
			input: 'list',
			output: 'messageRunList',
			type: 'method',
		},
		{
			input: 'reset',
			output: 'messageRunReset',
			type: 'method',
		},
		{
			input: 'info',
			output: 'messageRunInfo',
			type: 'method',
			default: true
		}
	]
})
export class CustomCommandCommand extends PuppyBotCommand {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		this.registerSlashCommand(registry, new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
			.addSubcommand((builder) =>
				builder
					.setName('add')
					.setDescription('Adds a new custom command.')
					.addStringOption((option) =>
						option
							.setName('name')
							.setDescription('The name to use for the command.')
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('output')
							.setDescription(`The output to write whenever the command is called.`)
							.setRequired(true)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('alias')
					.setDescription('Provides an alias for an existing command.')
					.addStringOption((option) =>
						option
							.setName('command')
							.setDescription('The command to provide an alias for.')
							// .setChoices([
							// 	['x', 'y'],
							// ])
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('alias')
							.setDescription(`The new alias name to use.`)
							.setRequired(true)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('remove')
					.setDescription('Removes a custom command.')
					.addStringOption((option) =>
						option
							.setName('command')
							.setDescription('The command to remove.')
							// .setChoices([
							// 	['x', 'y'],
							// ])
							.setRequired(true)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('edit')
					.setDescription('Edits an existing custom command.')
					.addStringOption((option) =>
						option
							.setName('command')
							.setDescription('The command to edit.')
							// .setChoices([
							// 	['x', 'y'],
							// ])
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('output')
							.setDescription(`The output to write whenever the command is called.`)
							.setRequired(true)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('rename')
					.setDescription('Renames an existing custom command.')
					.addStringOption((option) =>
						option
							.setName('command')
							.setDescription('The command to rename.')
							// .setChoices([
							// 	['x', 'y'],
							// ])
							.setRequired(true)
					)
					.addStringOption((option) =>
						option
							.setName('name')
							.setDescription(`The new name for the command.`)
							.setRequired(true)
					)
			)
			.addSubcommand((builder) =>
				builder
					.setName('list')
					.setDescription('Lists all existing custom commands.')
			)
			.addSubcommand((builder) =>
				builder
					.setName('reset')
					.setDescription('Resets all commands.')
			)
			.addSubcommand((builder) =>
				builder
					.setName('info')
					.setDescription('Shows information about the command.')
					.addStringOption((option) =>
						option
							.setName('command')
							.setDescription('The command to display.')
							// .setChoices([
							// 	['x', 'y'],
							// ])
							.setRequired(true)
					)
			)
		)
	}

	public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
		await this.run({
			subCommand: interaction.options.getSubcommand(true) as CustomCommandCommand.ValidSubCommand,
			messageOrInteraction: interaction,
			guild: interaction.guild!,
			user: interaction.user,
			options: {
				name: interaction.options.getString('name',),
				output: interaction.options.getString('output'),
				command: interaction.options.getString('command'),
				alias: interaction.options.getString('alias'),
			} as CustomCommandCommand.CommandOptions<'add' | 'alias' | 'edit' | 'info' | 'list' | 'remove' | 'rename' | 'reset'>,
		})
	}

	public async messageRunAdd(message: Message, args: Args) {
		this.run({
			subCommand: 'add',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				name: args.getOption('name') ?? this.error('No name given.'),
				output: args.getOption('output') ?? this.error('No output given.'),
			},
		})
	}

	public async messageRunAlias(message: Message, args: Args) {
		this.run({
			subCommand: 'alias',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				command: args.getOption('command') ?? this.error('No command name given.'),
				alias: args.getOption('alias') ?? this.error('No alias given.'),
			},
		})
	}

	public async messageRunRemove(message: Message, args: Args) {
		this.run({
			subCommand: 'remove',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				command: args.getOption('command') ?? this.error('No command name given.'),
			},
		})
	}

	public async messageRunEdit(message: Message, args: Args) {
		this.run({
			subCommand: 'edit',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				command: args.getOption('command') ?? this.error('No command name given.'),
				output: args.getOption('output') ?? this.error('No output given.'),
			},
		})
	}

	public async messageRunRename(message: Message, args: Args) {
		this.run({
			subCommand: 'rename',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				command: args.getOption('command') ?? this.error('No command name given.'),
				name: args.getOption('name') ?? this.error('No new name given.'),
			},
		})
	}

	public async messageRunReset(message: Message, _args: Args) {
		this.run({
			subCommand: 'reset',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
			},
		})
	}

	public async messageRunList(message: Message, _args: Args) {
		this.run({
			subCommand: 'list',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
			},
		})
	}

	public async messageRunInfo(message: Message, args: Args) {
		this.run({
			subCommand: 'info',
			messageOrInteraction: message,
			guild: message.guild!,
			user: message.author,
			options: {
				command: args.getOption('command') ?? this.error('No command name given.'),
			},
		})
	}

	public async run<S extends CustomCommandCommand.ValidSubCommand>(args: {
        messageOrInteraction: Message | CommandInteraction,
        subCommand: S,
        guild: Guild,
        user: User,
        options: CustomCommandCommand.CommandOptions<S>
    }) {
		const { subCommand, messageOrInteraction, guild, user, options } = args;

		if (subCommand === 'add') {
			if (!options['name'] || !options['output']) this.error(`Missing options.`, options);
			await this.handleAdd(messageOrInteraction, guild, user, options['name'], options['output']);
		} else if (subCommand === 'alias') {
			if (!options['command'] || !options['alias']) this.error(`Missing options.`, options);
			await this.handleAlias(messageOrInteraction, guild, user, options['command'], options['alias']);
		} else if (subCommand === 'remove') {
			if (!options['command']) this.error(`Missing options.`, options);
			await this.handleRemove(messageOrInteraction, guild, user, options['command']);
		} else if (subCommand === 'edit') {
			if (!options['command'] || !options['output']) this.error(`Missing options.`, options);
			await this.handleEdit(messageOrInteraction, guild, user, options['command'], options['output']);
		} else if (subCommand === 'rename') {
			if (!options['command'] || !options['name']) this.error(`Missing options.`, options);
			await this.handleRename(messageOrInteraction, guild, user, options['command'], options['name']);
		} else if (subCommand === 'reset') {
			await this.handleReset(messageOrInteraction, guild, user);
		} else if (subCommand === 'list') {
			await this.handleList(messageOrInteraction, guild, user);
		} else if (subCommand === 'info') {
			if (!options['command']) this.error(`Missing options.`, options);
			await this.handleInfo(messageOrInteraction, guild, user, options['command']);
		} else {
			await this.error(`Sub-command not found.`, args)
		}
	}

	protected static async executeFollowUp(followUp: (options: string | MessagePayload | ReplyMessageOptions) => Promise<Message<boolean>>, command: CustomCommand, user: User) {
		const message = await followUp({
			embeds: [new CustomCommandEmbed({
				schema: command
			})],
			components: [
				new MessageActionRow()
					.addComponents(
						CustomCommandEmbed.actions.map(action => new MessageButton(action))
					)
			]
		});
		message.createMessageComponentCollector({
			filter: (interaction) => CustomCommandEmbed.actions.map(a => a.customId).includes(interaction.customId) && interaction.user.id === user.id
		})
			.addListener('collect', async (interaction: ButtonInteraction) => {
				await CustomCommandEmbed.actions.find((action) => action.customId === interaction.customId)?.run(interaction, command);
			});
	}

	public async handleAdd(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, name: string, output: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		name = name.toLowerCase();

		const customCommandSystem = guild.customCommandSystem;

		const command = await customCommandSystem.add({
			name: name,
			content: output,
			guildId: guild.id,
			ownerId: user.id
		});

		await CustomCommandCommand.executeFollowUp(followUp, command, user);
	}

	public async handleAlias(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, commandName: string, alias: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const customCommandSystem = guild.customCommandSystem;

		const command = await customCommandSystem.edit({
			name: commandName.toLowerCase(),
			aliases: [alias.toLowerCase()]
		});

		await CustomCommandCommand.executeFollowUp(followUp, command, user);
	}

	public async handleRemove(messageOrInteraction: Message | CommandInteraction, guild: Guild, _user: User, commandName: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const customCommandSystem = guild.customCommandSystem;

		const command = customCommandSystem.getByNameOrAlias({
			name: commandName.toLowerCase()
		});

		if (command) {
			await customCommandSystem.remove(command);
			await followUp(`Removed command \`${command!.name}\`${(command!.aliases.length > 0) ? command!.aliases.map(alias => ` and its aliases: \`${alias}\``).join(', ') : ``}.`)
		} else {
			await followUp(`Command \`${commandName}\` not found.`)
		}
	}

	public async handleEdit(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, commandName: string, output: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const customCommandSystem = guild.customCommandSystem;

		const command = await customCommandSystem.edit({
			name: commandName.toLowerCase(),
			content: output
		})

		await CustomCommandCommand.executeFollowUp(followUp, command, user);
	}

	public async handleRename(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, commandName: string, newName: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const customCommandSystem = guild.customCommandSystem;

		var command = customCommandSystem.getByNameOrAlias({
			name: commandName.toLowerCase()
		})!;

		command = await customCommandSystem.edit({
			id: command.id,
			name: newName.toLowerCase()
		})

		await CustomCommandCommand.executeFollowUp(followUp, command, user);
	}

	@RequiresUserPermissions("ADMINISTRATOR")
	public async handleReset(messageOrInteraction: Message | CommandInteraction, guild: Guild, _user: User) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		const customCommandSystem = guild.customCommandSystem;

		await customCommandSystem.removeAll();

		await followUp(`Removed all custom commands from this server.`);
	}

	public async handleList(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User) {
		await this.generateFollowUp(messageOrInteraction);

		if(guild.customCommandSystem.customCommands.size === 0) {
			this.error(`No custom commands found on this server.`)
		}

		const paginatedMessage = new CustomCommandListPaginatedMessage({
			guild
		});

		await paginatedMessage.run(messageOrInteraction, user);
	}

	public async handleInfo(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, commandName: string) {
		const followUp = await this.generateFollowUp(messageOrInteraction);

		var command = guild.customCommandSystem.getByNameOrAlias({
			name: commandName.toLowerCase()
		});

		if (!command) {
			await followUp(`Command \`${commandName}\` not found.`)
		} else {
			await CustomCommandCommand.executeFollowUp(followUp, command, user);
		}
	}
}

export namespace CustomCommandCommand {
	export interface CommandStructure extends PuppyBotCommand.CommandStructure {
        'add': {
            'name': string,
            'output': string,
        },
		'alias': {
			'command': string,
			'alias': string,
		},
		'remove': {
			'command': string,
		},
		'edit': {
			'command': string,
			'output': string,
		},
		'rename': {
			'command': string,
			'name': string,
		},
		'list': {},
		'reset': {},
		'info': {
			'command': string,
		}
    }

    export type ValidSubCommand = PuppyBotCommand.ValidSubCommand<CommandStructure>
    export type ValidOption<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.ValidOption<CommandStructure, undefined, S>
    export type ValidOptionType<S extends ValidSubCommand | undefined = undefined, O extends ValidOption<S> | undefined = undefined> = PuppyBotCommand.ValidOptionType<CommandStructure, undefined, S, O>

    export type ValidHandler = ValidSubCommand;
    // export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
    export type CommandOptions<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.CommandOptions<CommandStructure, undefined, S>;
}