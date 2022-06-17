import { SlashCommandBuilder } from '@discordjs/builders';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, Command, container } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { readdirSync } from 'fs';
import { join, parse } from 'path';
import { CHAT_INPUT_OPTION_CHOICE_LIMIT } from '../../utils/constants';
import { PuppyBotCommand } from './PuppyBotCommand';

const BASE_MEDIA_FOLDER = './src/assets/media/';

export type TypeInfo = {
	description: string;
	path: string;
}

export type TypeDict = {
	[filename: string]: TypeInfo
}

export abstract class RandomMediaCommand extends PuppyBotCommand {
	protected mediaDir: string = BASE_MEDIA_FOLDER;
	protected folder: string;
	protected typeDict: TypeDict;

	public constructor(context: RandomMediaCommand.Context, options: RandomMediaCommand.Options) {
		super(context, {
			...options,
			detailedDescription: options.description + `  Examples:\n` +
				`  /${options.name}\n` +
				(options.typeDescriptions !== undefined) ?
				(`  /${options.name} ${Object.keys(options.typeDescriptions!)[0]}`) :
				"",
			requiredUserPermissions: ['SEND_MESSAGES'],
			requiredClientPermissions: ['SEND_MESSAGES'],
			nsfw: false,
			options: ['type']
		})

		var typeDict: TypeDict = ((options.typeDescriptions) ?
			Object.fromEntries(
				Object.entries(options.typeDescriptions)
					.map(t => [t[0], { description: t[1], path: "" }])
			) : {})
		this.folder = options.folder;
		var filenames = readdirSync(join(this.mediaDir, this.folder));

		if(filenames.length > CHAT_INPUT_OPTION_CHOICE_LIMIT) {
			container.logger.error(`Too many files to process for option limits.  Truncating list to ${CHAT_INPUT_OPTION_CHOICE_LIMIT}.`);
			filenames = filenames.slice(0, CHAT_INPUT_OPTION_CHOICE_LIMIT);
		}

		/* Auto-populate all types in the fileset. */
		for (var i in filenames) {
			const filename = parse(filenames[i]).name.toLowerCase();
			typeDict[filename] = {
				description: (options.typeDescriptions) ? (options.typeDescriptions)[filename] : "",
				path: join(this.mediaDir, this.folder, filenames[i])
			}
		}

		/* Only allow types that have a path. */
		this.typeDict = Object.fromEntries(
			Object.entries(typeDict)
				.filter(t => t[1].path !== undefined && t[1].description !== undefined)
		)
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		this.registerSlashCommand(registry, new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description)
			.addStringOption((option) =>
				option
					.setName("type")
					.setDescription("Select one of the image templates to use.")
					.setChoices(
						Object.entries(this.typeDict)
							.map(t => [t[1].description, t[0]]) as [
								name: string,
								value: string
							][]
					)
					.setRequired(false)
			)
		)
	}

	public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
		const type = interaction.options.getString('type');
		await interaction.deferReply()
		const file = await this.run(type);
		await interaction.editReply({ files: [file] });
	}

	public override async messageRun(message: Message, args: Args) {
		const type = args.getOption('type') as string;
		const file = await this.run(type);
		message.channel.send({
			files: [file]
		});
	}

	public async run(type?: string | null) {
		const keys = Object.keys(this.typeDict);
		if (!type) {
			type = keys[Math.floor(Math.random() * keys.length)];
		} else if (keys.indexOf(type) === -1) {
			this.error(type, `Could not find the file specified.  Please choose from the list: ${keys.join(', ')}`)
		}

		return this.typeDict[type].path;
	}
}

export namespace RandomMediaCommand {
	export type Options = PuppyBotCommand.Options & {
		folder: string;
		typeDescriptions?: {
			[filename: string]: string
		}
	}

	export type Context = Command.Context;
}