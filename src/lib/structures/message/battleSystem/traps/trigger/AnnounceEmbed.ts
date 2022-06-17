import { container } from "@sapphire/framework";
import type { BattleSystem } from "../../../../managers/BattleSystem";
import { BattleTrap as BT } from "../BattleTrapEmbed";
import { RecordEmbed } from "../BattleTrapRecordEmbed";

export class AnnounceEmbed extends RecordEmbed {
	public override get stringifyPhrase() { return `**Phrase**: [${this.trap?.phrase}](${this.stringifyPayload?.URL})` }

	public constructor(options: RecordEmbed.Options) {
		super({
			...options,
		} as RecordEmbed.Options);

		this.splitFields({
			content: [
				this.stringifyPhrase,
				this.stringifyPayload?.victim,
				this.stringifyOwner,
				this.stringifyDamage,
				this.stringifyDuration,
				this.stringifyPayload?.experience,
				"",
				BT.Embed.DefaultFooter
			].join('\n')
		});

		const triggerPayload = this.record?.payload as BattleSystem.Trap.Record.Payload.Trigger
		const victim = container.client.users.cache.get(triggerPayload?.victim.userId);
		const victimMember = this.guild?.members.cache.get(victim?.id ?? "");

		let iconUrl: string | undefined;
		if (triggerPayload.owner.userId === triggerPayload.victim.userId) {
			iconUrl = this.guild?.battleSystem.config.trapConfig.trapSelfIconSourceURL;
		} else {
			iconUrl = this.guild?.battleSystem.config.trapConfig.trapExplodeIconSourceURL;
		}

		this.setAuthor({
			iconURL: iconUrl,
			name: `Trap Triggered on ${victimMember?.displayName ?? victim?.username}`
		})

		this.setFooter({
			text: `Created on ${this.trap?.createdAt}`
		})
	}
}