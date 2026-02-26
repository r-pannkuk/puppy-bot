import { PaginatedMessage, PaginatedMessageOptions } from '@sapphire/discord.js-utilities';
import { Collection, Colors, ComponentType, Guild, GuildEmoji } from "discord.js";
import { Emojis } from "../../../utils/constants";
import type { EmojiRecords } from "../../managers/EmojiUsageManager";
import { PuppyBotEmbed } from "../PuppyBotEmbed";
import { ButtonStyle } from 'discord.js';

/** Maximum characters for a Discord embed description. */
const EMBED_DESCRIPTION_LIMIT = 4096;
/** Maximum characters for a Discord embed field value. */
const EMBED_FIELD_VALUE_LIMIT = 1024;
/** Maximum number of pages PaginatedMessage allows. */
const MAX_PAGES = 25;
/** One slot is always reserved for the "All" overview page. */
const MAX_EMOJI_PAGES = MAX_PAGES - 1;

export class EmojiUsagePaginatedMessage extends PaginatedMessage {
	// protected userIdFilter: [userId: string][];
	protected emojiIdFilter: [emojiId: string][];
	protected countReactions: boolean;
	protected guild: Guild;
	protected records: EmojiRecords;

	/**
	 * All emoji IDs sorted by total usage, with no artificial cap.
	 * Filtering only removes IDs that are no longer in the guild's emoji cache.
	 */
	public get emojiKeys(): string[] {
		return this.records
			.sort((a, b) =>
				b.userRecords.reduce((sum, v) => sum + (v.messageCount || 0) + (this.countReactions ? (v.reactionCount || 0) : 0), 0) -
				a.userRecords.reduce((sum, v) => sum + (v.messageCount || 0) + (this.countReactions ? (v.reactionCount || 0) : 0), 0)
			)
			.map((_value, key) => key.toString())
			.filter(e => this.guild.emojis.cache.has(e));
	}

	/**
	 * How many individual emojis to show per detail page.
	 * Computed dynamically so that ceil(emojiCount / emojisPerPage) never exceeds MAX_EMOJI_PAGES,
	 * which keeps the total page count within PaginatedMessage's hard limit of 25.
	 */
	public get emojisPerPage(): number {
		return Math.max(1, Math.ceil(this.emojiKeys.length / MAX_EMOJI_PAGES));
	}

	/** @deprecated Use emojiKeys. Retained for backwards compatibility. */
	public get Keys(): string[] {
		return ['All'].concat(this.emojiKeys);
	}

	public get Emojis(): Collection<string, GuildEmoji | undefined> {
		return this.records.mapValues((_value, key) => this.guild.emojis.cache.get(key.toString()));
	}

	public constructor(emojiRecords: EmojiRecords, options: EmojiUsagePaginatedMessage.Options) {
		super({
			...options,
			actions: options.actions ?? [
				{
					customId: EmojiUsagePaginatedMessage.InteractionIds.PreviousPage,
					style: ButtonStyle.Primary,
					emoji: Emojis.ArrowLeft,
					type: ComponentType.Button,
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
					style: ButtonStyle.Primary,
					emoji: Emojis.ArrowRight,
					type: ComponentType.Button,
					run: ({ handler }) => {
						if (handler.index === handler.pages.length - 1) {
							handler.index = 0;
						} else {
							++handler.index;
						}
					}
				},
			],
			template: options.template ?? new PuppyBotEmbed()
				.setColor(Colors.DarkGrey),
		})

		this.records = emojiRecords;
		this.emojiIdFilter = options.emojiIdFilter;
		// this.userIdFilter = options.userIdFilter;
		this.countReactions = options.countReactions;
		this.guild = options.guild;

		// Must sort before we call emojiKeys / emojisPerPage / generatePages.
		this.sortRecords();
		this.generatePages();

		// Add the group-navigation select menu AFTER pages are generated so that
		// emojiKeys and emojisPerPage reflect the final sorted state.
		this.addAction({
			customId: EmojiUsagePaginatedMessage.InteractionIds.GoToPage,
			type: ComponentType.StringSelect,
			options: this.generateGroupMenuOptions(),
			placeholder: "Jump to emoji group…",
			run: ({ handler, interaction }) => {
				if (interaction.isStringSelectMenu() && interaction.customId === EmojiUsagePaginatedMessage.InteractionIds.GoToPage) {
					// Values are stored as 0-based page indices.
					handler.index = parseInt(interaction.values[0], 10);
				}
			}
		});
	}

	/**
	 * Builds select-menu options for group-based navigation.
	 *
	 * Option 0 = "All" overview (page index 0).
	 * Options 1-24 = one entry per batch of `emojisPerPage` emojis;
	 *   the label shows the first (and optionally last) emoji name in the batch.
	 *
	 * Because emojisPerPage = ceil(N / 24), the number of batch options is at
	 * most 24, keeping the total within Discord's 25-option select-menu limit.
	 */
	public generateGroupMenuOptions() {
		const keys = this.emojiKeys;
		const groupSize = this.emojisPerPage;
		const menuOptions: { value: string; label: string; emoji?: string }[] = [];

		// "All" overview → page index 0.
		menuOptions.push({ value: '0', label: 'All' });

		for (let offset = 0; offset < keys.length; offset += groupSize) {
			const firstKey = keys[offset];
			const lastKey = keys[Math.min(offset + groupSize - 1, keys.length - 1)];
			// Page index: page 0 = "All", pages 1..M = batches in order.
			const pageIndex = Math.floor(offset / groupSize) + 1;

			const firstEmoji = this.guild.emojis.cache.get(firstKey);
			if (!firstEmoji) continue;

			if (firstKey === lastKey) {
				menuOptions.push({
					value: pageIndex.toString(),
					label: firstEmoji.name!,
					emoji: firstEmoji.id,
				});
			} else {
				const lastEmoji = this.guild.emojis.cache.get(lastKey);
				menuOptions.push({
					value: pageIndex.toString(),
					label: `${firstEmoji.name} – ${lastEmoji?.name ?? '?'}`,
					emoji: firstEmoji.id,
				});
			}
		}

		// Safety clamp — should never be needed given the emojisPerPage formula.
		return menuOptions.slice(0, 25);
	}

	/**
	 * Sorts records in place by total usage (descending).
	 * Also sorts each emoji's userRecords by that user's total.
	 */
	public sortRecords() {
		this.records.forEach((value) => {
			value.userRecords.sort((a, b) => {
				return (b.messageCount + (this.countReactions ? b.reactionCount : 0)) -
					(a.messageCount + (this.countReactions ? a.reactionCount : 0));
			});
		});

		this.records.sort((a, b) => {
			return b.userRecords.reduce((sum, value) => sum + value.messageCount + (this.countReactions ? value.reactionCount : 0), 0) -
				a.userRecords.reduce((sum, value) => sum + value.messageCount + (this.countReactions ? value.reactionCount : 0), 0);
		});
	}

	/**
	 * Builds all pages:
	 *  - Page 0: "All" overview listing every emoji's total usage.
	 *  - Pages 1..M: one page per batch of `emojisPerPage` emojis,
	 *    each showing per-user breakdowns via embed fields.
	 *
	 * Total pages = 1 + ceil(N / emojisPerPage) ≤ 25, regardless of guild emoji count.
	 */
	public generatePages() {
		this.pages = [];
		const keys = this.emojiKeys;
		const groupSize = this.emojisPerPage;
		const footerText = `Counting Emojis${this.countReactions ? ' and Reactions' : ''}`;

		// Page 0 — "All" overview.
		this.addPageEmbed((embed) =>
			embed
				.setTitle('All Emoji Usage')
				.setDescription(this.generateOverviewDescription())
				.setFooter({ text: footerText })
		);

		// Pages 1..M — one page per group.
		for (let offset = 0; offset < keys.length; offset += groupSize) {
			const batch = keys.slice(offset, offset + groupSize);
			const pageNumber = Math.floor(offset / groupSize) + 1;
			const totalPages = Math.ceil(keys.length / groupSize);

			this.addPageEmbed((embed) => {
				// Build a title from the emoji objects in this batch.
				const emojiStrings = batch
					.map(id => this.guild.emojis.cache.get(id))
					.filter(Boolean)
					.map(e => `${e}`)
					.join(' ');

				embed
					.setTitle(`Emoji Usage — Page ${pageNumber} of ${totalPages}`)
					.setDescription(emojiStrings || null)
					.setFooter({ text: footerText });

				// One embed field per emoji in this batch.
				for (const emojiId of batch) {
					const emoji = this.guild.emojis.cache.get(emojiId);
					if (!emoji) continue;

					const record = this.records.get(emojiId);
					const total = record?.userRecords.reduce(
						(sum, v) => sum + v.messageCount + (this.countReactions ? v.reactionCount : 0),
						0
					) ?? 0;

					const fieldName = `${emoji} ${emoji.name} (Total: ${total})`;
					const fieldValue = this.generateSpecificEmojiFieldValue(emojiId);

					embed.addFields({ name: fieldName, value: fieldValue });
				}

				return embed;
			});
		}
	}

	/**
	 * Builds the "All" overview description: one line per emoji, sorted by usage.
	 * Truncates gracefully if the content would exceed Discord's 4096-char limit.
	 */
	private generateOverviewDescription(): string {
		const lines = this.emojiKeys.reduce((acc: string[], key) => {
			const record = this.records.get(key);
			if (!record) return acc;
			const emoji = this.guild.emojis.cache.get(key);
			if (!emoji) return acc;
			const total = record.userRecords.reduce(
				(sum, v) => sum + (v.messageCount || 0) + (this.countReactions ? (v.reactionCount || 0) : 0),
				0
			);
			acc.push(`${emoji} — ${total}`);
			return acc;
		}, []);

		if (!lines.length) return 'No emoji usage recorded.';

		let description = '';
		let shown = 0;
		for (const line of lines) {
			const candidate = description ? `${description}\n${line}` : line;
			// Leave room for the truncation notice (~60 chars).
			if (candidate.length + 60 > EMBED_DESCRIPTION_LIMIT) break;
			description = candidate;
			shown++;
		}
		if (shown < lines.length) {
			description += `\n*…and ${lines.length - shown} more (use ◀ ▶ to browse all)*`;
		}
		return description;
	}

	/**
	 * Builds the per-user breakdown for a single emoji suitable for an embed field value.
	 * Truncates to Discord's 1024-char field-value limit.
	 */
	private generateSpecificEmojiFieldValue(emojiId: string): string {
		const record = this.records.get(emojiId);
		if (!record?.userRecords.size) return 'No usage.';

		const lines: string[] = [];
		for (const [userId, stats] of record.userRecords) {
			const member = this.guild.members.cache.get(userId);
			const count = stats.messageCount + (this.countReactions ? stats.reactionCount : 0);
			lines.push(`${member ?? `<@${userId}>`} — ${count}`);
		}

		let result = '';
		for (const line of lines) {
			const candidate = result ? `${result}\n${line}` : line;
			if (candidate.length + 20 > EMBED_FIELD_VALUE_LIMIT) {
				result += `\n*…and more*`;
				break;
			}
			result = candidate;
		}
		return result || 'No usage.';
	}
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