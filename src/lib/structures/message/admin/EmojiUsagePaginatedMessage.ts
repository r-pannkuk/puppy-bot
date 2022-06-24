import { PaginatedMessage, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { Constants, Guild } from "discord.js";
import { Emojis, SELECT_MENU_OPTION_LIMIT } from "../../../utils/constants";
import type { EmojiRecords } from "../../managers/EmojiUsageManager";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

export class EmojiUsagePaginatedMessage extends PaginatedMessage {
	// protected userIdFilter: [userId: string][];
	protected emojiIdFilter: [emojiId: string][];
	protected countReactions: boolean;
	protected guild: Guild;
	protected records: EmojiRecords;

	public get Keys() {
		var keys = this.records
			.map((_value, key) => key.toString())
			.filter(e => this.guild.emojis.cache.has(e));

		if (keys.length > SELECT_MENU_OPTION_LIMIT - 1) {
			keys = keys.slice(0, SELECT_MENU_OPTION_LIMIT - 1);
		}

		return ['All'].concat(keys);
	}

	public get Emojis() {
		return this.records.mapValues((_value, key) => this.guild.emojis.cache.get(key.toString()));
	}

	public constructor(emojiRecords: EmojiRecords, options: EmojiUsagePaginatedMessage.Options) {
		super({
			...options,
			actions: options.actions ?? [
				{
					customId: EmojiUsagePaginatedMessage.InteractionIds.PreviousPage,
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
					customId: EmojiUsagePaginatedMessage.InteractionIds.NextPage,
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
				// {
				// 	customId: EmojiUsagePaginatedMessage.InteractionIds.UserFilter,
				// 	style: 'SECONDARY',
				// 	emoji: Emojis.Asterisk,
				// 	type: Constants.MessageComponentTypes.BUTTON,
				// 	run: ({ handler }) => {
				// 		handler.
				// 	}
				// }
			],
			template: options.template ?? new PuppyBotEmbed()
				.setColor(Constants.Colors.DARK_GREY),
		})

		this.records = emojiRecords;
		this.emojiIdFilter = options.emojiIdFilter;
		// this.userIdFilter = options.userIdFilter;
		this.countReactions = options.countReactions;
		this.guild = options.guild;

		this.addAction({
			customId: EmojiUsagePaginatedMessage.InteractionIds.GoToPage,
			type: Constants.MessageComponentTypes.SELECT_MENU,
			placeholder: "Select Custom Emoji...",
			run: ({ handler, interaction }) => {
				if (interaction.isSelectMenu() && interaction.customId === EmojiUsagePaginatedMessage.InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10)
				}
			}
		});

		// this.addAction({
		// 	customId: EmojiUsagePaginatedMessage.InteractionIds.CountReactions,
		// 	type: Constants.MessageComponentTypes.SELECT_MENU,
		// 	options: [
		// 		{
		// 			label: "Count reactions in totals",
		// 			value: "true",
		// 			default: true
		// 		},
		// 		{
		// 			label: "Do NOT count reactions in totals",
		// 			value: "false"
		// 		}
		// 	],
		// 	placeholder: "Count Reactions as well?",
		// 	run: ({ interaction }) => {
		// 		if (interaction.isSelectMenu() && interaction.customId === EmojiUsagePaginatedMessage.InteractionIds.CountReactions) {
		// 			this.countReactions = Boolean(interaction.values[0]);
		// 			this.sortRecords();
		// 			this.generatePages();
		// 		}
		// 	}
		// })

		this.sortRecords();
		this.generatePages();
		this.generateSelectMenu();
	}

	/**
	 * Sorts in place the records against current sorting criteria.
	 */
	public sortRecords() {
		this.records.forEach((value) => {
			value.userRecords.sort((a, b) => {
				return (b.messageCount + ((this.countReactions) ? b.reactionCount : 0)) -
					(a.messageCount + ((this.countReactions) ? a.reactionCount : 0));
			})
		});

		this.records.sort((a, b) => {
			return b.userRecords.reduce((sum, value) => {
				return sum + value.messageCount +
					((this.countReactions) ? value.reactionCount : 0);
			}, 0) - a.userRecords.reduce((sum, value) => {
				return sum +
					value.messageCount +
					((this.countReactions) ? value.reactionCount : 0);
			}, 0)
		})
	}

	public generateSelectMenu() {
		this.setSelectMenuOptions((pageIndex) => {
			const key = this.Keys.at(pageIndex - 1);

			if (key === 'All') {
				return {
					label: 'All'
				}
			} else {
				const emoji = this.guild.emojis.cache.get(this.Keys.at(pageIndex - 1)!)!;
				return {
					label: emoji.name!,
					emoji: emoji,
				}
			}
		});
	}

	public generatePages() {
		this.pages = []
		for (const key of this.Keys) {
			this.addPageEmbed((embed) => {
				if (key === 'All') {
					return embed
						.setTitle(`All Emoji Usage`)
						.setDescription(this.generateDefaultEmbedDescription())
						.setFooter({
							text: `Counting Emojis${(this.countReactions) ? `and Reactions` : ``}`
						})
				} else {
					const emoji = this.guild.emojis.cache.get(key);
					return embed
						.setTitle(`${emoji} Usage`)
						.setDescription(this.generateSpecificEmojiDescription(key))
						.setFooter({
							text: `Counting Emojis${(this.countReactions) ? `and Reactions` : ``}`
						})
				}
			});
		}
	}

	private generateDefaultEmbedDescription() {
		return this.records
			.reduce((sum: string[], value, key) => {
				var total = value.userRecords.reduce((sum, value) => {
					return sum + (value.messageCount || 0) + ((this.countReactions) ? (value.reactionCount || 0) : 0)
				}, 0)

				return sum.concat(`${this.guild.emojis.cache.get(key.toString())} - ${total}`);
			}, []).join('\n');
	}

	private generateSpecificEmojiDescription(emoji) {
		return this.records.get(emoji)?.userRecords.reduce((sum: string[], value, key) => {
			return sum.concat(
				`${this.guild.members.cache.get(key.toString())} - ${value.messageCount + ((this.countReactions) ? value.reactionCount : 0)}`
			)
		}, []).join('\n') || "No usage.";
	}

	// private generateSpecificUserDescription(user) {
	// 	return this.records.reduce((sum: string[], value) => {
	// 		const userStats = value.get(user.id);
	// 		return sum.concat(`${(userStats?.messageCount || 0) + ((this.countReactions) ? (userStats?.reactionCount || 0) : 0)}`);
	// 	}, []).join('\n');
	// }
}

export namespace EmojiUsagePaginatedMessage {
	export type Options = PaginatedMessageOptions & {
		userIdFilter: [userId: string][],
		emojiIdFilter: [emojiId: string][],
		guild: Guild,
		countReactions: boolean,
	}

	export enum InteractionIds {
		PreviousPage = 'EmojiUsagePaginatedMessage.previousPage',
		NextPage = 'EmojiUsagePaginatedMessage.nextPage',
		GoToPage = 'EmojiUsagePaginatedMessage.goToPage',
		UserFilter = 'EmojiUsagePaginatedMessage.userFilter',
		CountReactions = 'EmojiUsagePaginatedMessage.countReactions',
	}
}