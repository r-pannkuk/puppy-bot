import { PaginatedMessage, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Collection, Constants, Guild, MessageEmbed } from "discord.js";
import { Emojis } from "../../../utils/constants";
import type { AdvanceWarsByWeb } from "../../managers/games/AWBWScanner";
import { GameRegistryGameEmbed } from "./GameRegistryGameEmbed";

export enum _InteractionIds {
	PreviousPage = 'GameRegistryGameListPaginatedMessage.previousPage',
	NextPage = 'GameRegistryGameListPaginatedMessage.nextPage',
	GoToPage = 'GameRegistryGameListPaginatedMessage.goToPage'
}

export const InteractionIds = { ..._InteractionIds };

export type RegistryRecord = AdvanceWarsByWeb.RegistryRecord.Instance;
export type GameRecord = AdvanceWarsByWeb.GameRecord.Instance;

export class GameRegistryGameListPaginatedMessage extends PaginatedMessage {
	protected guildId: string;
	protected fetchExpired: boolean;

	public get guild() {
		return container.client.guilds.cache.get(this.guildId)!;
	}
	protected _registryEntries: RegistryRecord[] | undefined = undefined;

	public get registryEntries() {
		if (!this._registryEntries) return Array.from(
			this.guild.games.awbw.gameRegistryEntries
				.filter((value) => this.fetchExpired || (value.getGameRecord()?.isActive ?? false))
				.values());
		return this._registryEntries;
	}
	public get games() {
		const games = this.registryEntries
			.map((value) => value.getGameRecord())
			.filter((value => value !== undefined)) as GameRecord[];
		return games;
	}


	public constructor(options: GameRegistryGameListPaginatedMessage.Options) {
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
		this.fetchExpired = options.fetchExpired ?? false;

		if (options.registryEntries) {
			if (options.registryEntries instanceof Collection) {
				this._registryEntries = Array.from(options.registryEntries.values());
			} else {
				this._registryEntries = options.registryEntries;
			}
		}

		this.addAction({
			customId: InteractionIds.GoToPage,
			type: Constants.MessageComponentTypes.SELECT_MENU,
			run: ({ handler, interaction }) => {
				if (interaction.isSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10)
				}
			}
		});

		if(this.registryEntries.length === 0 && !this.fetchExpired) {

			if(options.fetchExpired === undefined || options.fetchExpired === null) {
				this.fetchExpired = true;
			}

			if(this.registryEntries.length === 0) {
				this.addPageEmbed(new MessageEmbed({
					description: `No tracked games were found.`
				}))
				return;
			}
		}

		this.generatePages();
		this.generateSelectMenu();
	}

	public generateSelectMenu() {
		this.setSelectMenuOptions((pageIndex) => {
			const game = this.games.at(pageIndex - 1);

			if (game) {
				return {
					label: `${game.gameType}: ${game.gameId}`,
				}
			} else {
				return {
					label: `NOT_FOUND`
				}
			}
		});
	}

	public generatePages() {
		for (var entry of this.registryEntries) {
			this.addPageEmbed(new GameRegistryGameEmbed({
				registryRecord: entry
			}));
		}

	}
}

export namespace GameRegistryGameListPaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		guild: Guild,
		registryEntries?: RegistryRecord[] | Collection<string, RegistryRecord>,
		fetchExpired?: boolean
	}
}