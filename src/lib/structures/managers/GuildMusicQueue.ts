/**
 * @file GuildMusicQueue.ts
 * @description Per-guild music queue state for the Shoukaku/Lavalink music backend.
 *
 * Shoukaku does not provide a built-in queue; this module supplies the
 * lightweight data structure that holds pending tracks and playback metadata
 * for each guild.  The queue is stored on the Discord.js Client via the
 * `musicQueue` augmentation declared in `augments.d.ts`.
 */
import type { Track } from 'shoukaku';

/** Ephemeral per-guild music queue state stored on the Client. */
export interface GuildMusicQueue {
    /** Ordered list of tracks remaining to be played (index 0 = current track). */
    tracks: Track[];
    /** Snowflake ID of the voice channel the bot is currently inhabiting. */
    voiceChannelId: string;
    /** Snowflake ID of the text channel to send "now playing" notices to. */
    textChannelId: string;
    /** Whether the queue is currently looping the current track. */
    loop: boolean;
}
