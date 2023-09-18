import { container, UserError } from "@sapphire/framework";
import type { EmbedData } from "discord.js";
import type { AdvanceWarsByWeb } from "../../managers/games/AWBWScanner";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

export type UserRecord = AdvanceWarsByWeb.UserRecord.Instance;

export class GameRegistryUserEmbed extends PuppyBotEmbed {
	protected userRecords: UserRecord[] | undefined = undefined;
	protected userId: string | undefined = undefined;

	public get user() {
		return container.client.users.cache.get(this.userId ?? ``);
	}

	public get stringifyUser() { return `**User**: ${this.user}` }


	public constructor(options: GameRegistryUserEmbed.Options) {
		if (options && options.userRecords.length === 0) throw new UserError({ identifier: `No user records found.`, context: options.userRecords })

		super(options);

		if(options) {
			this.userRecords = options.userRecords;
			this.userId = this.userRecords[0].getDiscordUser()!.id;
		}

		let content: string[] = [
			this.stringifyUser,
			'',
		];

		if(this.userRecords) {
			for (var record of this.userRecords) {
				content.push(this.stringifyRecord(record));
			}
		}

		this.splitFields({content});
	}

	protected stringifyRecord(record: UserRecord) {
		return `**${record.gameType}**: ${record.userGameId}`;
	}
}

export namespace GameRegistryUserEmbed {
	export type Options = EmbedData & {
		userRecords: UserRecord[]
	}
}