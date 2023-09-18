import type { UserError } from "@sapphire/framework";
import type { EmbedData } from "discord.js";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

export class UserErrorEmbed extends PuppyBotEmbed {
	protected error: UserError;
	public constructor(options: UserErrorEmbed.Options) {
		super({
			...options
		})

		this.error = options.error;

		this.setTitle(`Error`);

		this.splitFields({
			content: [
				this.error.identifier,
				"",
				`Context:`,
				`\`${(typeof this.error.context === 'object') ? JSON.stringify(this.error.context, (_, value) =>
					typeof value === 'bigint'
					? value.toString()
					: value
				) : this.error.context}\``
			]
		});
	}
}

export namespace UserErrorEmbed {
	export type Options = EmbedData & {
		error: UserError
	}
}