import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { GuildTextBasedChannel } from "discord.js";
import { AdvanceWarsByWeb } from "../../../../lib/structures/managers/games/AWBWScanner";
import { GameScanGameEmbed } from "../../../../lib/structures/message/games/GameScanGameEmbed";

@ApplyOptions<Listener.Options>({
	event: AdvanceWarsByWeb.Events.EndGame,
	emitter: container.client,
})
export class AdvanceWarsByWebAnnounceEndGame extends Listener<typeof AdvanceWarsByWeb.Events.EndGame> {
	public async run(event: AdvanceWarsByWeb.Event.Instance<'EndGame'>) {
		const game = event.getGame()!;
		const guilds = container.client.guilds.cache.filter(guild =>
			guild.games.awbw.games.map(game => game.id).includes(game.id)
		);

		for (var [_, guild] of guilds) {
			// Notify the guild.
			if (guild.games.awbw.config?.outputChannelId) {
				const channel = guild.channels.cache.get(guild.games.awbw.config.outputChannelId) as GuildTextBasedChannel;
				await channel?.send({
					embeds: [
						new GameScanGameEmbed({
							gameRecord: game
						})
					],
				});
			}
		}
	}
}