import { container, Events, Listener } from "@sapphire/framework";
import type { Client, Collection, TextBasedChannel } from "discord.js";
import { ApplyOptions } from '@sapphire/decorators'

import { GuildCreateGuildInitialize } from "../guildCreate/guildInitialize";

@ApplyOptions<Listener.Options>({
    emitter: container.client,
    once: true,
    event: Events.ClientReady
})
export class ReadyLoadGuildData extends Listener<typeof Events.ClientReady> {
    public async run(client: Client) {
        for (var [_, guild] of client.guilds.cache) {
            await GuildCreateGuildInitialize.loadGuild(client, guild);

            var textChannels = guild.channels.cache.filter(c => c.isText()) as Collection<string, TextBasedChannel>;

            for (var [_, channel] of textChannels) {
                await channel.messages.fetch({ limit: 100 });
            }
        };
    }
}