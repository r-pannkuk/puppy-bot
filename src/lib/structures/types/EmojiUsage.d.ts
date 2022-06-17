import type { Collection } from "discord.js";

export type EmojiRecords = Collection<[emojiId: string], EmojiUserRecords>

export type EmojiUserRecords = Collection<[userId: string], {
    messageCount: number,
    reactionCount: number
}>;

