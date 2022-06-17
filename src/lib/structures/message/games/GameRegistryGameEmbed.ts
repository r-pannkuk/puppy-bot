import { container } from "@sapphire/framework";
import type { AdvanceWarsByWeb } from "../../managers/games/AWBWScanner";
import { GameScanGameEmbed } from "./GameScanGameEmbed";

export type RecordInstance = AdvanceWarsByWeb.RegistryRecord.Instance;

export class GameRegistryGameEmbed extends GameScanGameEmbed {
	protected registryEntry: RecordInstance | undefined = undefined;

	public get stringifyGameRequester() { return `**Requester**: ${container.client.users.cache.get(this.registryEntry?.registeringUserId ?? '')}` }

	public constructor(options: GameRegistryGameEmbed.Options) {
		super({
			...options,
			gameRecord: (options === undefined) ? undefined : options.registryRecord.getGameRecord()!,
		});

		if(options) {
			this.registryEntry = options.registryRecord;
		}

		this.splitFields({
			content: [
				this.stringifyGameRequester
			],
		});
	}
}

export namespace GameRegistryGameEmbed {
	export type Options = Omit<GameScanGameEmbed.Options, 'gameRecord'> & {
		registryRecord: RecordInstance
	}
}