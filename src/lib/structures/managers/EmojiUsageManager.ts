import {
	EmojiRecord as _EmojiRecord,
	EmojiUserRecord as _EmojiUserRecord,
	GuildScanRegistryType
} from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import { Collection, Guild, GuildTextBasedChannel, Message } from "discord.js";
import { AGuildScannerRegistryOwner } from "./AGuildScannerRegistryOwner";

export type EmojiRecords = Collection<string, EmojiUsageManager.EmojiRecord.Instance>

export class EmojiUsageManager extends AGuildScannerRegistryOwner<typeof GuildScanRegistryType.EmojiUsage> {
	protected _records: EmojiRecords;
	public get records(): EmojiRecords {
		return new Collection(
			Array.from(this._records.values(), (v) => [
				v.emojiId, 
				{
					...v,
					userRecords: new Collection(
						Array.from(v.userRecords.values(), (u) => [u.userId, u])
					)
				}
			])
		)
	}

	protected _working: EmojiRecords = new Collection();
	protected isWorking: boolean = false;

	public constructor(guild: Guild) {
		super(guild, GuildScanRegistryType.EmojiUsage, (channel: GuildTextBasedChannel) => (channel as GuildTextBasedChannel) ? true : false);

		this._records = new Collection();
		// (async () => {
		// 	await this.loadRecords();
		// })();
	}

	private _instantiateEmojiRecord(record: _EmojiRecord) {
		return {
			...record,
			userRecords: new Collection(Array.from(record.userRecords, (v) => [v.userId, v]))
		} as EmojiUsageManager.EmojiRecord.Instance
	}

	public async loadRecords() {
		var loadedRecords = await container.database.guildEmojiUsage.findUnique({
			where: {
				guildId: this.guildId
			},
		});

		if (loadedRecords) {
			for (var record of loadedRecords.emojiRecords) {
				this._records.set(record.emojiId, this._instantiateEmojiRecord(record));
			}
		}
	}

	public async startCollecting() {
		if (!this.guild) throw new UserError({ identifier: `Guild wasn't found.`, context: this.guildId });
		if (this.isWorking) throw new UserError({ identifier: `Already running query.`, context: this.lastMessageStore.map((c) => c.createdAt) });

		this.beginCollection();

		const count = await this.guild.scanner.fetchAllMessages(this.lastMessageStore);
		await this.writeCollection();
		await this.generateLastMessageStore();
		this.isWorking = false;
		return { records: this.records, count };
	}

	public beginCollection() {
		this._working = this._records.clone() ?? new Collection();
		this.isWorking = true;
	}

	public collectChunk(messages: Collection<string, Message>) {
		for (var [_, message] of messages) {
			if (message.author.id === container.client.user?.id || message.author.bot) continue;

			var matchedEmojis = this.guild!.emojis.cache.filter(e => {
				const regex = new RegExp(e.id.toString(), 'gi');
				return (message.content.match(regex) || []).length > 0;
			})

			for (var [_, emoji] of matchedEmojis) {
				let record = this._working.get(emoji.id) || this._working.set(emoji.id, {
					emojiId: emoji.id,
					userRecords: new Collection<string, EmojiUsageManager.EmojiUserRecord.Instance>()
				}).get(emoji.id)!;

				let userRecord = record.userRecords.get(message.author.id) || {
					userId: message.author.id,
					messageCount: 0,
					reactionCount: 0
				};

				const regex = new RegExp(emoji.id.toString(), 'gi');

				userRecord.messageCount += (message.content.match(regex) || []).length

				record.userRecords.set(message.author.id, userRecord)
				this._working.set(emoji.id, record);
			}

			for (var [_, reaction] of message.reactions.cache) {
				if (!reaction.emoji.id) continue;

				let record = this._working.get(emoji.id) || this._working.set(emoji.id, {
					emojiId: emoji.id,
					userRecords: new Collection<string, EmojiUsageManager.EmojiUserRecord.Instance>()
				}).get(emoji.id)!;

				for (var [_, user] of reaction.users.cache) {
					let userRecord = record.userRecords.get(user.id) || {
						userId: user.id,
						messageCount: 0,
						reactionCount: 0
					};

					userRecord.reactionCount += 1;
					record.userRecords.set(user.id, userRecord);
				};

				this._working.set(reaction.emoji.id, record);
			}
		}

		const lastMessage = messages.last();

		if (lastMessage) {
			this._registry.set(lastMessage.channel.id, {
				channelId: lastMessage.channel.id,
				guildId: this.guildId,
				lastMessageScannedId: lastMessage.id,
				type: this.scanType,
			});
		}
	}

	public async writeCollection() {
		if (this._working.size === 0 || this._working === this._records) return;

		const dbEmojiRecords = this._working!.map((records, emojiId) => {
			return {
				emojiId,
				userRecords: records.userRecords.map((userRecord) => userRecord as _EmojiUserRecord)
			};
		});

		await container.database.guildEmojiUsage.upsert({
			where: {
				guildId: this.guild!.id
			},
			create: {
				guildId: this.guild!.id,
				emojiRecords: dbEmojiRecords,
			},
			update: {
				emojiRecords: dbEmojiRecords,
			}
		});

		this._records = this._working;

		await this.writeRegistry();
	}

}

export namespace EmojiUsageManager {
	export namespace EmojiRecord {
		export type Instance = Omit<_EmojiRecord, 'userRecords'> & {
			userRecords: Collection<string, EmojiUserRecord.Instance>
		}
	}

	export namespace EmojiUserRecord {
		export type Instance = _EmojiUserRecord & {

		}
	}
}