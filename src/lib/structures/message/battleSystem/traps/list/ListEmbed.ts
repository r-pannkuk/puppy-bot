import { BattleTrap as BT } from "../BattleTrapEmbed";
import { RecordEmbed } from "../BattleTrapRecordEmbed";

export class ListEmbed extends RecordEmbed {
	public constructor(options: RecordEmbed.Options) {
		super({
			...options,
		} as RecordEmbed.Options);

		let content: string[] = [];

		content = [
			this.stringifyPhrase,
			this.stringifyStatus,
			this.stringifyOwner,
			this.stringifyDamage,
			this.stringifyDuration,
			"",
			BT.Embed.DefaultFooter
		]

		this.splitFields({
			content
		});

		this.setAuthor({
			iconURL: this.guild?.battleSystem.config.trapConfig.trapArmedIconSourceURL,
			name: `Trap: ${this.trap?.phrase} <${this.trap?.id}>`
		})

		this.setFooter({
			text: `Created on ${this.trap?.createdAt}`
		})
	}
}

export namespace ListEmbed {
	export type Options = RecordEmbed.Options & {

	}
}