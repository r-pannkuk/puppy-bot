import type { MessageEmbedOptions } from "discord.js";
import type { AdvanceWarsByWeb } from "../../managers/games/AWBWScanner";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

export type GameRecord = AdvanceWarsByWeb.GameRecord.Instance;

export class GameScanGameEmbed extends PuppyBotEmbed {
	protected _gameRecord: GameRecord | undefined = undefined;
	public get gameRecord() { return this._gameRecord; }

	public get currentTurnUser() { return this.gameRecord?.getCurrentUserRecord()?.getDiscordUser() ?? this.gameRecord?.getLastEvent()?.payload.currentTurnAWBWUserId; }
	public get gameWinner() { return this.gameRecord?.getWinnerUserRecord()?.getDiscordUser() ?? this.gameRecord?.getEndEvent()?.payload.winnerAWBWUserId; }

	public get stringifyGameId() { return `**Game ID**: [${this.gameRecord?.gameId}](${this.gameRecord?.url})` }
	public get stringifyGameType() { return `**Game Type**: ${this.gameRecord?.gameType}`; }
	public get stringifyGameState() { return `**State**: ${this.gameRecord?.isActive ? `Active` : `Finished`}` }
	public get stringifyGameWinner() { return `**Winner**: ${this.gameWinner}` }
	public get stringifyGameCurrentUser() { return `**Current Turn**: ${this.currentTurnUser}` }


	public constructor(options: GameScanGameEmbed.Options) {
		super(options);

		if (options) {
			if (options.gameRecord) {
				this._gameRecord = options.gameRecord;
			} 
		}

		let content: string[] = [];
		content = [
			this.stringifyGameId,
			this.stringifyGameType,
			this.stringifyGameState,
		];

		if (!this.gameRecord?.isActive) {
			content.push(this.stringifyGameWinner);
		} else if(this.gameRecord.getLastEvent() !== undefined) {
			content.push(this.stringifyGameCurrentUser);
		}

		this.splitFields({ content });
	}
}

export namespace GameScanGameEmbed {
	export type Options = MessageEmbedOptions & {
		gameRecord?: GameRecord,
		content?: string[]
	}
}