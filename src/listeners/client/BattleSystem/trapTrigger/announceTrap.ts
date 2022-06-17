import { ApplyOptions } from "@sapphire/decorators";
import { container, Listener } from "@sapphire/framework";
import type { GuildTextBasedChannel } from "discord.js";
import { BattleSystem } from "../../../../lib/structures/managers/BattleSystem";
import { AnnounceEmbed } from "../../../../lib/structures/message/battleSystem/traps/trigger/AnnounceEmbed";

@ApplyOptions<Listener.Options>({
	event: BattleSystem.Trap.Events.Trigger,
	emitter: container.client,
})
export class TrapTriggerAnnounceTrap extends Listener<typeof BattleSystem.Trap.Events.Trigger> {
	public async run(_trap: BattleSystem.Trap.Instance, record: BattleSystem.Trap.Record.Instance.Trigger) {
		const guild = container.client.guilds.cache.get(record.guildId)!;
		if (!guild) return;

		const embed = new AnnounceEmbed({
			record: record
		});

		(guild.channels.cache.get(record.payload.trigger.channelId) as GuildTextBasedChannel).send({
			embeds: [embed]
		})

		if (!guild.battleSystem.trapChannel) return;

		guild.battleSystem.trapChannel.send({
			embeds: [
				new AnnounceEmbed({
					record: record
				})
			]
		})
	}
}