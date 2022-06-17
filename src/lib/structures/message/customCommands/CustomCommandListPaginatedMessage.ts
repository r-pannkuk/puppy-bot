import { PaginatedMessage, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Constants, Guild } from "discord.js";
import { Emojis } from "../../../utils/constants";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

const PAGE_CHUNK_SIZE = 30;

export enum _InteractionIds {
	PreviousPage = 'CustomCommandListPaginatedMessage.previousPage',
	NextPage = 'CustomCommandListPaginatedMessage.nextPage',
	GoToPage = 'CustomCommandListPaginatedMessage.goToPage'
}

export const InteractionIds = { ..._InteractionIds };

export class CustomCommandListPaginatedMessage extends PaginatedMessage {
	protected guildId: string;

	public get guild() {
		return container.client.guilds.cache.get(this.guildId)!;
	}

	public get customCommands() {
		return this.guild.customCommandSystem.customCommands;
	}

	public get chunks() {
		return this.customCommands
			.map((command) => command.name)
			.sort((a, b) => a.localeCompare(b))
			.reduce((all, one, i) => {
				const chunkIndex = Math.floor(i / PAGE_CHUNK_SIZE);
				all[chunkIndex] = new Array<string>().concat((all[chunkIndex] || new Array<string>()), one);
				return all;
			}, new Array<string[]>());
	}

	public constructor(options: CustomCommandListPaginatedMessage.Options) {
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
					}
				},
			]
		})

		this.guildId = options.guild.id;

		this.addAction({
			customId: InteractionIds.GoToPage,
			type: Constants.MessageComponentTypes.SELECT_MENU,
			run: ({ handler, interaction }) => {
				if (interaction.isSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10)
				}
			}
		});

		this.generatePages();
		this.generateSelectMenu();
	}

	public generateSelectMenu() {
		this.setSelectMenuOptions((pageIndex) => {
			const range = this.chunks!.at(pageIndex - 1);
			if (range) {
				const first = range[0];
				const last = range[range.length - 1];
				return {
					label: `[${first}] . . . [${last}]`,
				}
			} else {
				return {
					label: `NOT_FOUND`
				}
			}
		});
	}

	public generatePages() {
		this.pages = []
		for (var chunk of this.chunks) {
			const commands = this.customCommands
				.filter((command) => chunk.includes(command.name))
				.sort((a, b) => a.name.localeCompare(b.name))

			const strings = commands.map((command) => {
				const aliases = command.aliases
					.sort((a, b) => a.localeCompare(b));

				return `\`${command.name}\`${(aliases.length > 0) ? `(\`${aliases.join(`\`, \``)}\`)` : ``} [${container.client.users.cache.get(command.ownerId)}]- Used ${command.useCount} time${(command.useCount === 1) ? `` : `s`}.`;
			})

			this.addPageEmbed(new PuppyBotEmbed()
				.setTitle(`${this.guild.name}'s Custom Commands:`)
				.splitFields({
					content: strings
				})
			);
		}
	}
}

export namespace CustomCommandListPaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		guild: Guild
	}
}