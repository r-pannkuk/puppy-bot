import { BattleTrap as BT } from "../BattleTrapEmbed";

export class CheckEmbed extends BT.Embed {
	protected get battleUser() { return this.trap?.getBattleUser(); }

	public constructor(options: BT.Embed.Options) {
		super({
			...options
		});

		if (this.trap) {

			this.splitFields({
				content: [
					this.stringifyPhrase,
					this.stringifyStatus,
					this.stringifyDamage,
					this.stringifyDuration,
					"",
					BT.Embed.DefaultFooter
				]
			});

			this.setAuthor({
				iconURL: this.guild?.battleSystem.config.trapConfig.trapArmedIconSourceURL,
				name: `Trap: ${this.trap.phrase} <${this.trap.id}>`
			})

			this.setFooter({
				text: `Created on ${this.trap.createdAt}`
			})
		}
	}
}