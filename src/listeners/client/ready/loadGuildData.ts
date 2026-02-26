import { Events, Listener } from "@sapphire/framework";
import type { Client } from "discord.js";
import { ApplyOptions } from '@sapphire/decorators'

import { GuildCreateGuildInitialize } from "../guildCreate/guildInitialize";

/**
 * Fired once on {@link Events.ClientReady}.
 *
 * Iterates all guilds the bot is currently a member of and runs full
 * guild initialization (settings, subsystems, custom commands, etc.).
 *
 * Note: The previous bulk message-fetch that fetched 100 messages per text
 * channel was removed. It caused Discord rate-limit exhaustion at startup
 * and was not required for any current feature.
 */
@ApplyOptions<Listener.Options>({
    once: true,
    event: Events.ClientReady
})
export class ReadyLoadGuildData extends Listener<typeof Events.ClientReady> {
    public async run(client: Client) {
        for (const [, guild] of client.guilds.cache) {
            await GuildCreateGuildInitialize.loadGuild(client, guild);
        }
    }
}