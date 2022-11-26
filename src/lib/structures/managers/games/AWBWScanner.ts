import {
	GameScanUserRecord as _GameScanUserRecord,
	GameScanGameRecord as _GameScanGameRecord,
	GameScanEvent as _GameScanEvent,
	GameScanConfig,
	GameScanEventType,
	GameScanGameType,
	Prisma,
	GameScanGuildRegisterGameRecord
} from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import { Time } from "@sapphire/time-utilities";
import type { JobOptions } from "bull";
import { Collection, User } from "discord.js";
import { default as got } from 'got';
import { JSDOM } from 'jsdom';
import { envParseInteger } from "../../../env/utils";
import { debugLog } from "../../../utils/logging";
import type { IConfigLoader as IGuildConfigLoader } from "../IConfigLoader";
import type { IGuildManager } from "../IGuildManager";

const AWBW_GAME_VIEW_URL = `https://awbw.amarriner.com/game.php?games_id=`;

const WINNER_QUERY_TYPES = {
	SEARCH: 'img[title="Winner"]',
	IDENTIFY: 'a[class="norm bold"]'
};

const CURRENT_TURN_QUERY_TYPES = {
	SEARCH: 'img[title="Your Turn"]',
	IDENTIFY: 'a[class="norm bold"]'
};

const GAME_TIME_HEADER_QUERY_TYPES = {
	DAY: 'span[class="bold game-header-day game-header-info"]',
	TOTAL_TIME: 'span[class="game-header-total "]',
}

export class AWBWScanner implements IGuildConfigLoader<GameScanConfig>, IGuildManager {
	protected guildId: string;
	public get guild() {
		return container.client.guilds.cache.get(this.guildId);
	};

	protected _config: GameScanConfig | undefined = undefined;
	public get config() {
		return this._config;
	}

	private static intervalSecs: number = envParseInteger('AWBW_SCAN_INTERVAL_SECS');
	private static isLoaded: boolean = false;
	private static isLoading: boolean = false;

	private static userCache: Collection<string, AdvanceWarsByWeb.UserRecord.Instance>;
	public static get users() { return this.userCache; }
	public get users() {
		return AWBWScanner.userCache
			.filter((record) => this.guild?.members.cache.has(record.getDiscordUser()?.id ?? '') ?? false);
	}

	private static gameCache: Collection<string, AdvanceWarsByWeb.GameRecord.Instance>;
	public static get games() { return this.gameCache; }
	public static get activeGames() { return this.games.filter((value) => value.isActive); }

	private _registry: Collection<string, AdvanceWarsByWeb.RegistryRecord.Instance>;
	public get gameRegistryEntries() { return this._registry.clone(); }
	public get games() {
		const gameRecordIds = this._registry.map((entry) => entry.gameScanGameRecordId);
		return AWBWScanner.gameCache
			.filter((game) => gameRecordIds.includes(game.id));
	}
	public get activeGames() { return this.games.filter((value) => value.isActive); }


	private static eventCache: Collection<string, AdvanceWarsByWeb.Event.Instance<any>>;
	public static get events() { return this.eventCache; }
	public get events() {
		const games = this.games;
		return AWBWScanner.eventCache
			.filter((record) => games.has(record.gameId));
	}

	public constructor(guild) {
		this.guildId = guild.id;

		this._registry = new Collection();
		// (async () => {
		// 	await this.loadConfig();
		// 	await this.loadRegistry();
		// })();

		if (!AWBWScanner.isLoaded) {
			AWBWScanner.userCache = new Collection();
			AWBWScanner.gameCache = new Collection();
			AWBWScanner.eventCache = new Collection();
			(async () => {
				AWBWScanner.loadFromDB();
				AWBWScanner.scheduleTasks();
			})();
		}
	}

	private _instantiateRegistryRecord(record: GameScanGuildRegisterGameRecord): AdvanceWarsByWeb.RegistryRecord.Instance {
		return {
			...record,
			getGameRecord: () => this.games.get(record.gameScanGameRecordId)
		} as AdvanceWarsByWeb.RegistryRecord.Instance;
	}

	private static _instantiateUserRecord(userRecord: _GameScanUserRecord): AdvanceWarsByWeb.UserRecord.Instance {
		return {
			...userRecord,
			getDiscordUser: () => container.client.users.cache.get(userRecord.userDiscordId)
		}
	}

	private static _instantiateGameRecord(gameRecord: _GameScanGameRecord): AdvanceWarsByWeb.GameRecord.Instance {
		const getEvents = () => this.events.filter((value) => value.gameId === gameRecord.gameId);
		const getLastEvent = () => getEvents().filter((value) => value.eventType === GameScanEventType.CurrentTurn).last() as AdvanceWarsByWeb.Event.Instance<'CurrentTurn'>;
		const getEndEvent = () => getEvents().find((value) => value.eventType === GameScanEventType.EndGame) as AdvanceWarsByWeb.Event.Instance<'EndGame'>;
		return {
			...gameRecord,
			url: `https://awbw.amarriner.com/2030.php?games_id=${gameRecord.gameId}`,
			getEvents,
			getLastEvent,
			getCurrentUserRecord: () => {
				if (!gameRecord.isActive) return undefined;

				const currentUserId = getLastEvent().payload.currentTurnAWBWUserId;

				return this.users.find((value) => value.userGameId === currentUserId);
			},
			getEndEvent,
			getWinnerUserRecord: () => {
				if (gameRecord.isActive) return undefined;

				const winnerUserId = getEndEvent().payload.winnerAWBWUserId;

				return this.users.find((value) => value.userGameId === winnerUserId);
			}
		};
	}

	private static _instantiateEvent(event: _GameScanEvent): AdvanceWarsByWeb.Event.Instance<any> {
		return {
			...event,
			payload: event.payload as AdvanceWarsByWeb.Payload<typeof event.eventType>,
			getGame: () => this.gameCache.find((game) => game.gameId === event.gameId)
		}
	}

	public async loadConfig() {
		var loadedConfig = await container.database.gameScanConfig.findFirst({
			where: {
				guildId: {
					equals: this.guildId
				},
				gameType: {
					equals: GameScanGameType.AdvanceWarsByWeb
				},
			},
		})

		if (!loadedConfig) {
			loadedConfig = await container.database.gameScanConfig.create({
				data: {
					guildId: this.guildId,
					gameType: GameScanGameType.AdvanceWarsByWeb
				}
			})
		}

		this._config = loadedConfig;
	}

	public async loadRegistry() {
		var loadedRegistry = await container.database.gameScanGuildRegisterGameRecord.findMany({
			where: {
				guildId: {
					equals: this.guildId
				},
				gameRecord: {
					gameType: GameScanGameType.AdvanceWarsByWeb
				}
			},
		})

		for (var entry of loadedRegistry) {
			this._registry.set(entry.id, this._instantiateRegistryRecord(entry));
		}
	}

	private static async scheduleTasks() {
		container.tasks.create(
			AdvanceWarsByWeb.ScheduledTask.CheckGameStatus,
			{

			} as AdvanceWarsByWeb.ScheduledTaskPayload,
			{
				type: 'repeated',
				interval: AWBWScanner.intervalSecs * 1000,
				bullJobOptions: {
					jobId: AdvanceWarsByWeb.ScheduledTask.CheckGameStatus,
					removeOnComplete: true,
				} as JobOptions
			}
		)
	}

	public static async loadFromDB() {
		if (!this.isLoading) {
			this.isLoading = true;
			await this.loadUsersFromDB();
			await this.loadGamesFromDB();
			await this.loadEventsFromDB();
			this.isLoading = false;
			this.isLoaded = true;
		}
	}

	public static async loadUsersFromDB() {
		var loadedUsers = await container.database.gameScanUserRecord.findMany({
			where: {
				gameType: GameScanGameType.AdvanceWarsByWeb,
			}
		})

		for (var user of loadedUsers) {
			this.userCache.set(user.id, this._instantiateUserRecord(user));
		}
	}

	public static async loadGamesFromDB() {
		var loadedGames = await container.database.gameScanGameRecord.findMany({
			where: {
				gameType: GameScanGameType.AdvanceWarsByWeb,
			}
		})

		for (var game of loadedGames) {
			this.gameCache.set(game.id, this._instantiateGameRecord(game));
		}
	}

	public static async loadEventsFromDB() {
		var loadedEvents = await container.database.gameScanEvent.findMany({
			where: {
				gameType: GameScanGameType.AdvanceWarsByWeb,
			}
		})

		for (var event of loadedEvents) {
			this.eventCache.set(event.id, this._instantiateEvent(event));
		}
	}

	public static async generateUserRecord(discordUserId: string, userGameId: string) {
		const foundUser = this.users.find((value) => value.userGameId === userGameId);
		if (foundUser) return foundUser;

		const userRecord = await container.database.gameScanUserRecord.create({
			data: {
				userDiscordId: discordUserId,
				userGameId,
				gameType: GameScanGameType.AdvanceWarsByWeb,
			}
		})

		this.userCache.set(userRecord.id, this._instantiateUserRecord(userRecord));
		return this.userCache.get(userRecord.id)!;
	}

	public static async generateUserRecords(userRecords: [discordUserId: string, userGameId: string]) {
		var ids: string[] = [];
		for (var [discordUserId, userGameId] of userRecords) {
			const createdRecord = await this.generateUserRecord(discordUserId, userGameId);
			if (createdRecord) {
				ids.push(createdRecord.id);
			}
		}

		return this.userCache.filter((value) => ids.includes(value.id));
	}

	public static async generateGameRecord(gameId: string) {
		const foundGame = this.games.find((value) => value.gameId === gameId);
		if (foundGame) return foundGame;

		const gameRecord = this._instantiateGameRecord(
			await container.database.gameScanGameRecord.create({
				data: {
					gameType: GameScanGameType.AdvanceWarsByWeb,
					isActive: true,
					gameId,
				},
			})
		)

		this.gameCache.set(gameRecord.id, gameRecord);
		return gameRecord;
	}

	public static async generateGameEvent<T extends GameScanEventType>(event: {
		gameId: string,
		eventType: T,
		payload: AdvanceWarsByWeb.Payload<T>
	}) {
		const createdEvent = await container.database.gameScanEvent.create({
			data: {
				gameType: GameScanGameType.AdvanceWarsByWeb,
				createdAt: new Date(Date.now()),
				eventType: event.eventType,
				gameId: event.gameId,
				payload: event.payload
			},
		})

		this.eventCache.set(createdEvent.id, this._instantiateEvent(createdEvent));
		return this.eventCache.get(createdEvent.id);
	}

	public async setConfig(args: {
		outputChannelId: string,
	} | {
		intervalSecs: number,
	} | {
		outputChannelId: string,
		intervalSecs: number,
	}) {
		const config = await container.database.gameScanConfig.update({
			where: {
				id: this.config!.id,
			},
			data: {
				...args
			}
		});

		this._config = config;
		return this.config;
	}

	public async registerGameId(user: User, game: AdvanceWarsByWeb.GameRecord.Instance) {
		const foundRegistryEntry = this._registry.find((entry) => entry.getGameRecord()?.gameId === game.gameId);
		if (foundRegistryEntry) throw new UserError({ identifier: `Game is already registered to this guild.`, context: game })

		const registryEntry = await container.database.gameScanGuildRegisterGameRecord.create({
			data: {
				guildId: this.guildId,
				registeringUserId: user.id,
				gameScanGameRecordId: game.id
			}
		});

		this._registry.set(registryEntry.id, this._instantiateRegistryRecord(registryEntry));
		return this._registry.get(registryEntry.id)!;
	}

	public async unregisterGameId(game: AdvanceWarsByWeb.GameRecord.Instance) {
		const foundRegistryEntry = this._registry.find((entry) => entry.getGameRecord()?.gameId === game.gameId);
		if (!foundRegistryEntry) throw new UserError({ identifier: `No game ID found in registry.`, context: game });

		await container.database.gameScanGuildRegisterGameRecord.delete({
			where: {
				guildId_gameScanGameRecordId: {
					guildId: this.guildId,
					gameScanGameRecordId: foundRegistryEntry.gameScanGameRecordId
				}
			}
		});

		this._registry.delete(foundRegistryEntry.id);
		return foundRegistryEntry;
	}

	public static async removeGames(gameIds: string[]) {
		const cachedGames = this.gameCache.filter((value) => gameIds.includes(value.gameId));

		if (cachedGames.size === 0) throw new UserError({ identifier: `No record found for Game ID's.`, context: gameIds })

		for (var [_, cachedGame] of cachedGames) {
			await container.database.gameScanGameRecord.delete({
				where: {
					id: cachedGame.id
				}
			})

			this.gameCache.delete(cachedGame.id);
		}
	}

	public static async removeUser(discordUserId: string) {
		const cachedUsers = this.userCache.filter((value) => value.userDiscordId === discordUserId);

		if (cachedUsers.size === 0) throw new UserError({ identifier: `No record found for User ID's.`, context: discordUserId })

		for (var [_, cachedUser] of cachedUsers) {
			await container.database.gameScanUserRecord.delete({
				where: {
					id: cachedUser.id
				}
			});

			this.userCache.delete(cachedUser.id)
		}
	}

	public async checkActiveGames() {
		for (var [id] of this.activeGames) {
			await AWBWScanner.checkGame(id)
		}
	}

	public static async checkActiveGames() {
		for (var [id] of this.activeGames) {
			await AWBWScanner.checkGame(id);
		}
	}

	public static async checkGame(id: string) {
		var game = this.games.get(id)!;
		if (!game) throw new UserError({ identifier: `Game wasn't found.`, context: id })

		const url = `${AWBW_GAME_VIEW_URL}${game.gameId}`
		got(url).then(async response => {
			const dom = new JSDOM(response.body);
			const document = dom.window.document;

			let dayNo: number | undefined | null = await (async () => {
				try {
					return parseInt(document.querySelector(GAME_TIME_HEADER_QUERY_TYPES.DAY)?.textContent?.replace(/^\D+/g, '') ?? 'fail');
				} catch (e) {
					return undefined;
				}
			})()

			let totalTime: number | undefined | null = await (async () => {
				try {
					const totalTime = document.querySelector(GAME_TIME_HEADER_QUERY_TYPES.TOTAL_TIME)!.textContent!.replace(/^\D+/g, '');
					const [days, hours, minutes] = totalTime.split(' ').map(x => parseInt(x)).values();
					return ((days * Time.Day) + (hours * Time.Hour) + (minutes * Time.Minute)) / 1000;
				} catch (e) {
					return undefined;
				}
			})()

			let winnerAWBWUserId: string | undefined | null = await (async () => {
				try {
					const winner = document.querySelector(WINNER_QUERY_TYPES.SEARCH);
					const parentNode = winner?.parentNode?.parentNode;
					return parentNode?.querySelector(WINNER_QUERY_TYPES.IDENTIFY)?.getAttribute('title')
				} catch (e) {
					return undefined;
				}
			})();

			let currentTurnAWBWUserId: string | undefined | null = await (async () => {
				try {
					const currentTurn = document.querySelector(CURRENT_TURN_QUERY_TYPES.SEARCH);
					const parentNode = currentTurn?.parentNode?.parentNode;
					return parentNode?.querySelector(CURRENT_TURN_QUERY_TYPES.IDENTIFY)?.getAttribute('title')
				} catch (e) {
					return undefined;
				}
			})();

			let event: AdvanceWarsByWeb.Event.Instance<'CurrentTurn' | 'EndGame'> | undefined = undefined;
			if (currentTurnAWBWUserId) {
				const lastEvent = game.getEvents()
					.filter((value) => value.eventType === GameScanEventType.CurrentTurn)
					.last();

				event = this._instantiateEvent(
					await container.database.gameScanEvent.create({
						data: {
							createdAt: new Date(Date.now()),
							eventType: GameScanEventType.CurrentTurn,
							gameId: game.gameId,
							gameType: GameScanGameType.AdvanceWarsByWeb,
							payload: {
								currentTurnAWBWUserId,
								dayNo,
								isNewTurn: (!lastEvent) || (
									lastEvent.payload.dayNo !== dayNo ||
									lastEvent.payload.currentTurnAWBWUserId !== currentTurnAWBWUserId
								),
								totalTime
							} as AdvanceWarsByWeb.Payload.GameScanCurrentTurnEvent
						}
					})
				)

				this.eventCache.set(event.id, event);
				container.client.emit(AdvanceWarsByWeb.Events.CurrentTurn, event);
			}
			if (winnerAWBWUserId) {
				game = this._instantiateGameRecord(
					await container.database.gameScanGameRecord.update({
						where: {
							id: game.id,
						},
						data: {
							isActive: false
						}
					})
				);

				this.gameCache.set(game.id, game);

				event = this._instantiateEvent(
					await container.database.gameScanEvent.create({
						data: {
							createdAt: new Date(Date.now()),
							eventType: GameScanEventType.EndGame,
							gameId: game.gameId,
							gameType: GameScanGameType.AdvanceWarsByWeb,
							payload: {
								dayNo,
								winnerAWBWUserId
							} as AdvanceWarsByWeb.Payload.GameScanEndGameEvent
						}
					})
				)

				this.eventCache.set(event.id, event);
				container.client.emit(AdvanceWarsByWeb.Events.EndGame, event);
			}

			return event;
		}).catch(err => {
			debugLog('error', `${err}`);
			throw err;
		});
	}
}

export namespace AdvanceWarsByWeb {
	export namespace RegistryRecord {
		export interface Instance extends GameScanGuildRegisterGameRecord {
			getGameRecord(): GameRecord.Instance | undefined
		}
	}
	export namespace UserRecord {
		export interface Instance extends _GameScanUserRecord {
			getDiscordUser(): User | undefined
		}
	}
	export namespace GameRecord {
		export interface Instance extends _GameScanGameRecord {
			url: string,
			getEvents(): Collection<string, Event.Instance<any>>,
			getLastEvent(): AdvanceWarsByWeb.Event.Instance<'CurrentTurn'> | undefined
			getCurrentUserRecord(): UserRecord.Instance | undefined
			getEndEvent(): AdvanceWarsByWeb.Event.Instance<'EndGame'> | undefined
			getWinnerUserRecord(): UserRecord.Instance | undefined
		}
	}
	export namespace GameScanUserRecord {
		export interface Instance extends _GameScanUserRecord {

		}
	}
	export namespace Event {
		export interface Instance<T extends GameScanEventType> extends _GameScanEvent {
			eventType: T,
			getGame(): GameRecord.Instance | undefined,
			payload: Payload<T>
		}
	}
	export namespace Payload {
		export interface GameScanCurrentTurnEvent extends Prisma.JsonObject {
			currentTurnAWBWUserId: string
			dayNo: number
			totalTime: number
			isNewTurn: boolean
		}
		export interface GameScanEndGameEvent extends Prisma.JsonObject {
			winnerAWBWUserId: string;
			dayNo: number;
		}
	}

	export type Payload<T extends GameScanEventType> =
		(
			T extends typeof GameScanEventType.CurrentTurn
			? Payload.GameScanCurrentTurnEvent
			: never
		) | (
			T extends typeof GameScanEventType.EndGame
			? Payload.GameScanEndGameEvent
			: never
		)

	export interface ScheduledTaskPayload {
	}

	export const Events = {
		CurrentTurn: `AdvanceWarsByWeb.CurrentTurn`,
		EndGame: `AdvanceWarsByWeb.EndGame`,
	}

	export const ScheduledTask = {
		CheckGameStatus: 'gameScanner.AWBW.CheckGameStatus'
	}
}