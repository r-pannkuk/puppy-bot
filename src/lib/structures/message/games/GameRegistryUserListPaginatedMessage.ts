import { PaginatedMessage, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Collection, Constants, Guild } from "discord.js";
import { Emojis } from "../../../utils/constants";
import type { AdvanceWarsByWeb } from "../../managers/games/AWBWScanner";
import { GameRegistryUserEmbed } from "./GameRegistryUserEmbed";

export enum _InteractionIds {
	PreviousPage = 'GameRegistryUserListPaginatedMessage.previousPage',
	NextPage = 'GameRegistryUserListPaginatedMessage.nextPage',
	GoToPage = 'GameRegistryUserListPaginatedMessage.goToPage'
}

export const InteractionIds = { ..._InteractionIds };

export class GameRegistryUserListPaginatedMessage extends PaginatedMessage {
	protected guildId: string;

	public get guild() {
		return container.client.guilds.cache.get(this.guildId)!;
	}

	public get recordCollection() {
		return this.guild.games.awbw.users
			.reduce((sum, record) => {
				const discordUser = record.getDiscordUser();
				if (!discordUser) return sum;
				return sum.set(discordUser.id, (sum.get(discordUser.id) ?? []).concat([record]));
			}, new Collection<string, AdvanceWarsByWeb.UserRecord.Instance[]>())
			.sort((_a, _b, key1, key2) => {
				const memberA = this.guild.members.cache.get(key1)!;
				const memberB = this.guild.members.cache.get(key2)!;

				return memberA.displayName.localeCompare(memberB.displayName);
			})
	}

	public constructor(options: GameRegistryUserListPaginatedMessage.Options) {
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
			const member = this.guild.members.cache.get(
				this.recordCollection.keyAt(pageIndex - 1)!
			)!;

			if (member) {
				return {
					label: member.displayName,
				}
			} else {
				return {
					label: `NOT_FOUND`
				}
			}
		});
	}

	public generatePages() {
		for (var [_, records] of this.recordCollection) {
			this.addPageEmbed(new GameRegistryUserEmbed({
				userRecords: records
			}));
		}

	}
}

export namespace GameRegistryUserListPaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		guild: Guild
	}
}