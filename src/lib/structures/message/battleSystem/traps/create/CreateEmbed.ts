import { BattleTrap as BT } from "../BattleTrapEmbed";

export class CreateEmbed extends BT.Embed {
	public constructor(options: BT.Embed.Options) {
		super({
			...options,
		} as BT.Embed.Options);

		this.splitFields({
			content: [
				this.stringifyPhrase,
				this.stringifyStatus,
				this.stringifyOwner,
				this.stringifyAbilityCost,
				"",
				BT.Embed.DefaultFooter
			].join('\n')
		});

		this.setAuthor({
			iconURL: this.guild?.battleSystem.config.trapConfig.trapArmedIconSourceURL,
			name: `New Trap Created: ${this.trap?.phrase} <${this.trapId}>`
		})

		this.setFooter({
			text: `Created on ${this.trap?.createdAt}`
		})
	}
}