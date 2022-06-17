import { BattleTrap as BT } from "../BattleTrapEmbed";
import type { RecordEmbed } from "../BattleTrapRecordEmbed";
import { ListEmbed } from "./ListEmbed";

export class ListHiddenEmbed extends ListEmbed {
	public constructor(options: ListHiddenEmbed.Options) {
		super({
			...options,
		} as ListEmbed.Options);

		let content: string[] = [];
		content = [
			this.stringifyPhraseObscured,
			this.stringifyStatus,
			this.stringifyOwner,
			this.stringifyDamage,
			this.stringifyDuration,
			"",
			BT.Embed.DefaultFooter
		]

		this.setFields([]);
		this.setDescription("");

		this.splitFields({
			content
		});

		this.setAuthor({
			iconURL: this.guild?.battleSystem.config.trapConfig.trapArmedIconSourceURL,
			name: `Trap: <${this.trap?.id}>`
		})
	}
}

export namespace ListHiddenEmbed {
	export type Options = RecordEmbed.Options & {

	}
}