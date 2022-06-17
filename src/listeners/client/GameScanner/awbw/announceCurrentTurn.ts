import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { GuildTextBasedChannel } from "discord.js";
import { AdvanceWarsByWeb } from "../../../../lib/structures/managers/games/AWBWScanner";
import { GameScanGameEmbed } from "../../../../lib/structures/message/games/GameScanGameEmbed";

@ApplyOptions<Listener.Options>({
	event: AdvanceWarsByWeb.Events.CurrentTurn,
	emitter: container.client,
})
export class AdvanceWarsByWebAnnounceCurrentTurn extends Listener<typeof AdvanceWarsByWeb.Events.CurrentTurn> {
	public async run(event: AdvanceWarsByWeb.Event.Instance<'CurrentTurn'>) {
		if(!event.payload.isNewTurn) return;
		
		const game = event.getGame()!;
		const guilds = container.client.guilds.cache.filter(guild =>
			guild.games.awbw.activeGames.map(game => game.id).includes(game.id)
		);

		for (var [_, guild] of guilds) {
			// Notify the guild.
			if(guild.games.awbw.config?.outputChannelId) {
				const currentTurnUser = guild.games.awbw.users.find((value) => value.userGameId === event.payload.currentTurnAWBWUserId)?.getDiscordUser();
				const channel = guild.channels.cache.get(guild.games.awbw.config.outputChannelId) as GuildTextBasedChannel;
				await channel?.send({
					content: (currentTurnUser === undefined) ? undefined : `${currentTurnUser}`,
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