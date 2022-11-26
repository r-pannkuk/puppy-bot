import { BattleAbilityConfig, BattleAbilityType, BattleConfig, BattleLevelConfig, BattleTrap, BattleTrapConfig, BattleTrapDamageFormulaType, BattleTrapRecord, BattleTrapRecordType, BattleTrapState, BattleUser } from "@prisma/client";
import type * as Prisma from "@prisma/client";
import { container } from "@sapphire/framework";
import { Collection, CommandInteraction, Guild, GuildMember, GuildTextBasedChannel, Message, User } from "discord.js";
import { default as _config } from '../../../config/default/BattleConfig.json';
import { WHITE_CIRCLE } from "../../utils/constants";
import type { IGuildManager } from "./IGuildManager";
import type { IConfigLoader } from "./IConfigLoader";
import { envParseInteger } from "../../env/utils";
import type { JobOptions } from "bull";

const DEFAULT_CONFIG = {
	..._config,
	abilityConfigs: _config.abilityConfigs.map((ability) => ({
		...ability,
		type: ability.type as BattleAbilityType
	})),
	trapConfig: {
		..._config.trapConfig,
		damage: {
			..._config.trapConfig.damage,
			formulaType: _config.trapConfig.damage.formulaType as BattleTrapDamageFormulaType
		}
	}
};

export class BattleSystem implements IGuildManager, IConfigLoader<BattleConfig> {
	protected guildId: string;
	public get guild() {
		return container.client.guilds.cache.get(this.guildId)!;
	};
	protected _config: BattleConfig | undefined = undefined;
	public get config(): BattleSystem.Config.Instance {
		return {
			...this._config!,
			levelConfigs: new Collection(this._config!.levelConfigs.map((level) => [level.levelNum, level])),
			abilityConfigs: new Collection(this._config!.abilityConfigs.map((ability) => [ability.type, ability]))
		}
	}

	protected static regenIntervalSecs: number = envParseInteger('BATTLESYSTEM_INTERVAL_SECS');

	private cache: Collection<[battleUserId: string], BattleSystem.BattleUser.Instance>

	public get battleUsers() {
		return this.cache;
	}

	public get traps() {
		return this.cache.reduce((collection, battleUser) => {
			return collection.concat(
				new Collection(
					Array.from(
						battleUser.battleTraps.map((trap) => ({
							...trap,
						}))
						, (trap) => [trap.id as unknown as [trapId: string], trap]
					)
				)
			)
		}, new Collection<[trapId: string], BattleSystem.Trap.Instance>())
	}

	public get trapRecords() {
		return this.traps.reduce((collection, battleTrap) =>
			collection.concat(battleTrap.records)
			, new Collection<[recordId: string], BattleSystem.Trap.Record.Instance>()
		)
	}

	public get trapChannel(): GuildTextBasedChannel {
		return this.guild.channels.cache.get(this.config.trapConfig.trapChannelId ?? ``) as GuildTextBasedChannel;
	}

	public constructor(guild: Guild) {
		this.guildId = guild.id;
		this.cache = new Collection();
		
		// (async () => {
		// 	await this.loadConfig();
		// 	await this.loadFromDB();
		// 	await this.writeToDB();
		// })()
	}

	private _instantiateTrapRecord(record: BattleTrapRecord) {
		return {
			...record,
			getTrap: () => this.traps.get(record.trapId as unknown as [recordId: string])
		} as BattleSystem.Trap.Record.Instance
	}

	private _instantiateTrap(trap: BattleTrap & {
		records: Prisma.BattleTrapRecord[];
	}) {
		return {
			...trap,
			records: new Collection<[recordId: string], BattleSystem.Trap.Record.Instance>(
				Array.from(trap.records, (record) => [record.id as unknown as [recordId: string], this._instantiateTrapRecord(record)])
			),
			obscuredPhrase: trap.phrase.replaceAll(/\S/g, WHITE_CIRCLE),
			getBattleUser: () => this.cache.get(trap.battleUserId as unknown as [battleUserId: string]),
			damage: () => {
				if (this.config?.trapConfig.damage.formulaType === BattleTrapDamageFormulaType.Base)
					return BattleSystem.Trap.DamageFormula.BASE_DAMAGE(this.config, this.traps.get(trap.id as unknown as [trapId: string])!);
				if (this.config?.trapConfig.damage.formulaType === BattleTrapDamageFormulaType.Exponential)
					return BattleSystem.Trap.DamageFormula.EXPONENTIAL(this.config, this.traps.get(trap.id as unknown as [trapId: string])!);
				if (this.config?.trapConfig.damage.formulaType === BattleTrapDamageFormulaType.Linear)
					return BattleSystem.Trap.DamageFormula.LINEAR(this.config, this.traps.get(trap.id as unknown as [trapId: string])!);
				if (this.config?.trapConfig.damage.formulaType === BattleTrapDamageFormulaType.Interval)
					return BattleSystem.Trap.DamageFormula.INTERVAL(this.config, this.traps.get(trap.id as unknown as [trapId: string])!);

				return BattleSystem.Trap.DamageFormula.BASE_DAMAGE(this.config!, this.traps.get(trap.id as unknown as [trapId: string])!);
			},
			duration: () => {
				return BattleSystem.Trap.DurationFormula(this.traps.get(trap.id as unknown as [trapId: string])!)
			},
			experience: () => {
				return BattleSystem.Trap.ExperienceFormula.BASE_EXPERIENCE(this.config, this.traps.get(trap.id as unknown as [trapId: string])!);
			}
		} as BattleSystem.Trap.Instance;
	}

	private _instantiateUser(battleUser: BattleUser & {
		battleTraps: (BattleTrap & {
			records: Prisma.BattleTrapRecord[];
		})[];
	}) {
		return {
			...battleUser,
			getGuild: () => this.guild,
			getUser: () => container.client.users.cache.get(battleUser.userId),
			battleTraps: new Collection<[trapId: string], BattleSystem.Trap.Instance>(
				Array.from(battleUser.battleTraps, (trap) => [trap.id as unknown as [trapId: string], this._instantiateTrap(trap)])
			),
			getActiveTraps: () => this.cache.get(battleUser.id as unknown as [battleUserId: string])
				?.battleTraps.filter(t => t.state === BattleTrapState.Armed) ?? new Collection(),
			level: () => {
				const bU = this.battleUsers.get(battleUser.id as unknown as [battleUserId: string]);
				const inverseSortedLevels = this.config.levelConfigs
					.sort((a, b) => b.reqExperience - a.reqExperience)

				const index = inverseSortedLevels.findKey((level) =>
					level.reqExperience < bU!.stats.experience
				);
				const test = inverseSortedLevels.get(index ?? 1)!

				return test;
			}
		} as BattleSystem.BattleUser.Instance;
	}

	public async loadConfig() {
		var loadedConfig = await container.database.battleConfig.findFirst({
			where: {
				guildId: {
					equals: this.guild.id
				}
			},
			orderBy: {
				version: 'desc'
			}
		});

		if (!loadedConfig || loadedConfig.version < DEFAULT_CONFIG.version) {
			// Create new and save.
			loadedConfig = await container.database.battleConfig.create({
				data: {
					...DEFAULT_CONFIG,
					...loadedConfig,
					guildId: this.guild.id
				}
			})
		}

		this._config = loadedConfig;

		await container.tasks.create(
			"BattleSystem_RegenerateUsers",
			{
				guildId: this.guildId,
			},
			{
				repeated: true,
				interval: BattleSystem.regenIntervalSecs * 1000,
				customJobOptions: {
					removeOnComplete: true,
				} as JobOptions
			})
	}

	public async loadFromDB() {
		var loadedUsers = await container.database.battleUser.findMany({
			where: {
				guildId: this.guild.id
			},
			include: {
				battleTraps: {
					include: {
						records: true
					}
				}
			}
		})

		for (var battleUser of loadedUsers) {
			const currentEntry = this.cache.get(battleUser.id as unknown as [battleUserId: string]);

			if (!currentEntry || currentEntry.info.lastEditedAt < battleUser.info.lastEditedAt) {
				this.cache.set(battleUser.id as unknown as [battleUserId: string], this._instantiateUser(battleUser));
			}
		}
	}

	private async createUser(userId: string) {
		const configLevel1 = this.config!.levelConfigs.get(1);

		const battleUser = await container.database.battleUser.create({
			include: {
				battleTraps: {
					include: {
						records: true
					}
				}
			},
			data: {
				guildId: this.guild.id,
				userId: userId,
				info: {
					createdAt: new Date(Date.now()),
					lastEditedAt: new Date(Date.now())
				},
				stats: {
					energy: configLevel1?.maxEnergy ?? 0,
					experience: configLevel1?.reqExperience ?? 0,
					health: configLevel1?.maxHealth ?? 0,
				}
			}
		});

		this.cache.set(battleUser.id as unknown as [battleUserId: string],
			this._instantiateUser(battleUser)
		);

		return this.cache.get(battleUser.id as unknown as [battleUserId: string])!;
	}

	private async checkAttemptAbility<BattleAbilityType>(battleUser: BattleSystem.BattleUser.Instance, options: BattleSystem.Ability.Options<BattleAbilityType>) {
		if (battleUser.stats.energy < options.reqEnergy) {
			return {
				error: `Not enough energy.`
			}
		}
		if (battleUser.stats.experience < options.reqExperience) {
			return {
				error: `You don't know how to use that ability yet.`
			}
		}

		return {};
	}

	public async checkAttemptTrap(user: BattleSystem.BattleUser.Instance | User | string) {
		if (user instanceof User) {
			user = user.id;
		} else if (typeof user === 'string') {
			user = user;
		} else {
			user = user.userId;
		}

		const battleUser = await this.generateBattleUser(user);

		const genericAttempt = await this.checkAttemptAbility(battleUser, this.config.abilityConfigs.get('Trap')!)
		if (genericAttempt.error) {
			return genericAttempt;
		}

		if (battleUser.getActiveTraps().size >= battleUser.level().maxTraps) {
			return {
				error: `You're at your maximum trap capacity (${battleUser.level().maxTraps} traps) already.`
			}
		}

		return { error: undefined };
	}

	private async _generateTrapRecordPayload(messageOrInteraction: Message | CommandInteraction, owner: BattleSystem.BattleUser.Instance, trap?: BattleSystem.Trap.Instance | null) {
		let invocation: BattleSystem.Trap.Record.Payload._InvocationPayload;
		if (messageOrInteraction instanceof Message) {
			invocation = {
				channelId: messageOrInteraction.channelId,
				messageId: messageOrInteraction.id,
				type: 'Message'
			};
		} else {
			const fetchedReply = await messageOrInteraction.fetchReply();

			invocation = {
				channelId: messageOrInteraction.channelId,
				messageId: fetchedReply.id,
				type: 'Interaction',
				interactionId: messageOrInteraction.id
			}
		}

		return {
			config: {
				version: this.config.version,
			},
			createdAt: trap?.createdAt.getTime(),
			damage: {
				total: trap?.damage(),
				baseDamage: (trap) ? BattleSystem.Trap.DamageFormula.BASE_DAMAGE(this.config, trap) : 0,
				durationDamage: (trap) ? trap.damage() - BattleSystem.Trap.DamageFormula.BASE_DAMAGE(this.config, trap) : 0,
				numCharactersDamage: (trap) ? BattleSystem.Trap.DamageFormula.CHARACTERS_DAMAGE(this.config, trap) : 0,
				wordDamage: (trap) ? BattleSystem.Trap.DamageFormula.WORDS_DAMAGE(this.config, trap) : 0
			},
			duration: trap?.duration(),
			owner: {
				battleUserId: owner.id,
				energy: owner.stats.energy,
				experience: owner.stats.experience,
				health: owner.stats.health,
				userId: owner.userId
			},
			invocation: invocation,
			experience: {
				total: trap?.experience(),
				base: (trap) ? BattleSystem.Trap.ExperienceFormula.BASE_EXPERIENCE(this.config, trap) : 0,
				bonus: (trap) ? trap.experience() - BattleSystem.Trap.ExperienceFormula.BASE_EXPERIENCE(this.config, trap) : 0
			}
		}
	}

	public async createTrap(messageOrInteraction: Message | CommandInteraction, user: BattleSystem.BattleUser.Instance | User | string, phrase: string) {
		if (user instanceof User || typeof user === 'string') {
			user = await this.generateBattleUser(user)
		}

		const battleUser = user;

		// Create a trap.
		const trap = this._instantiateTrap(
			await container.database.battleTrap.create({
				data: {
					battleUserId: battleUser.id,
					createdAt: new Date(Date.now()),
					phrase: phrase,
					state: "Armed",
					records: {
						create: {
							guildId: this.guild.id,
							type: "Create",
							payload: await this._generateTrapRecordPayload(messageOrInteraction, battleUser)
						}
					}
				},
				include: {
					records: true
				}
			})
		);

		battleUser.battleTraps.set(trap.id as unknown as [trapId: string], trap);
		battleUser.stats.energy -= this.config.abilityConfigs.get('Trap')!.reqEnergy;

		this.cache.set(battleUser.id as unknown as [userId: string], user);

		await this.writeToDB([battleUser], [trap], []);

		container.client.emit(BattleSystem.Trap.Events.Create, trap, trap.records.first());

		return trap;
	}

	public async generateBattleUser(user: User | GuildMember | string) {
		if (user instanceof User || user instanceof GuildMember) {
			user = user.id
		}

		var battleUser = this.cache.find((battleUser) => battleUser.userId === user);

		if (!battleUser) {
			battleUser = await this.createUser(user);
		}

		return battleUser;
	}

	public async generateBattleUsers() {
		return this.guild.members.cache.map(async (user) => await this.generateBattleUser(user))
	}

	public async triggerTrap(messageOrInteraction: Message | CommandInteraction, trap: BattleSystem.Trap.Instance) {
		const owner = trap.getBattleUser();

		let victim: BattleSystem.BattleUser.Instance;
		if (messageOrInteraction instanceof Message) {
			victim = await this.generateBattleUser(messageOrInteraction.author);
		} else {
			victim = await this.generateBattleUser(messageOrInteraction.user);
		}

		const generatedPayload = await this._generateTrapRecordPayload(messageOrInteraction, owner, trap)
		const payload = {
			...generatedPayload,
			trigger: generatedPayload.invocation,
			firedAt: Date.now(),
			victim: {
				battleUserId: victim.id,
				energy: victim.stats.energy,
				experience: victim.stats.experience,
				health: victim.stats.health,
				userId: victim.userId
			}
		} as BattleSystem.Trap.Record.Payload.Trigger;

		const record = this._instantiateTrapRecord(
			await container.database.battleTrapRecord.create({
				data: {
					guildId: messageOrInteraction.guild!.id,
					type: "Trigger",
					trapId: trap.id,
					payload: payload
				}
			})
		)

		trap.state = BattleTrapState.Fired;
		trap.records.set(record.id as unknown as [recordId: string], record)
		owner.battleTraps.set(trap.id as unknown as [trapId: string], trap);
		owner.stats.experience += trap.experience();
		this.battleUsers.set(victim.id as unknown as [battleUserId: string], victim);

		victim.stats.health -= trap.damage();
		this.battleUsers.set(owner.id as unknown as [battleUserId: string], owner);

		await this.writeToDB([owner, victim], [trap], []);

		container.client.emit(BattleSystem.Trap.Events.Trigger, trap, record);

		return record;
	}

	public async disarmTrap(messageOrInteraction: Message | CommandInteraction, trap: BattleSystem.Trap.Instance) {

		const owner = trap.getBattleUser();

		let disarmer: BattleSystem.BattleUser.Instance;
		if (messageOrInteraction instanceof Message) {
			disarmer = await this.generateBattleUser(messageOrInteraction.author);
		} else {
			disarmer = await this.generateBattleUser(messageOrInteraction.user);
		}

		const generatedPayload = await this._generateTrapRecordPayload(messageOrInteraction, owner, trap)
		const payload = {
			...generatedPayload,
			disarmer: {
				battleUserId: disarmer.id,
				energy: disarmer.stats.energy,
				experience: disarmer.stats.experience,
				health: disarmer.stats.health,
				userId: disarmer.userId
			},
			disarmedAt: Date.now()
		} as BattleSystem.Trap.Record.Payload.Disarm;

		const record = this._instantiateTrapRecord(
			await container.database.battleTrapRecord.create({
				data: {
					guildId: messageOrInteraction.guild!.id,
					type: "Disarm",
					trapId: trap.id,
					payload: payload
				}
			})
		)

		trap.state = BattleTrapState.Disarmed;
		trap.records.set(record.id as unknown as [recordId: string], record)
		owner.battleTraps.set(trap.id as unknown as [trapId: string], trap);
		this.battleUsers.set(disarmer.id as unknown as [battleUserId: string], disarmer);

		disarmer.stats.experience += trap.experience();
		this.battleUsers.set(owner.id as unknown as [battleUserId: string], owner);

		await this.writeToDB([owner, disarmer], [trap], []);

		container.client.emit(BattleSystem.Trap.Events.Disarm, trap, record);

		return record;
	}

	public async removeTrap(messageOrInteraction: Message | CommandInteraction, trap: BattleSystem.Trap.Instance) {
		const owner = trap.getBattleUser();

		const generatedPayload = await this._generateTrapRecordPayload(messageOrInteraction, owner, trap)
		const payload = {
			...generatedPayload,
			removedAt: Date.now(),
		} as BattleSystem.Trap.Record.Payload.Remove;

		const record = this._instantiateTrapRecord(
			await container.database.battleTrapRecord.create({
				data: {
					guildId: this.guild.id,
					type: "Remove",
					trapId: trap.id,
					payload: payload
				}
			})
		)

		trap.state = BattleTrapState.Removed;
		trap.records.set(record.id as unknown as [recordId: string], record)
		owner.battleTraps.set(trap.id as unknown as [trapId: string], trap);
		this.battleUsers.set(owner.id as unknown as [battleUserId: string], owner);

		await this.writeToDB([owner], [trap], []);

		container.client.emit(BattleSystem.Trap.Events.Remove, trap, record);

		return record;
	}

	public async setConfig(args: {
		levelConfigs?: Collection<number, BattleLevelConfig>
		abilityConfigs?: Collection<string, BattleAbilityConfig>,
		trapConfig?: BattleTrapConfig
	}) {
		var loadedConfig = await container.database.battleConfig.update({
			where: {
				guildId_version: {
					guildId: this.guildId,
					version: this._config?.version ?? `1.0.0`
				}
			},
			data: {
				trapConfig: args.trapConfig,
				levelConfigs: args.levelConfigs?.map((value) => value),
				abilityConfigs: args.abilityConfigs?.map((value) => value),
			}
		});

		this._config = loadedConfig;

		return loadedConfig;
	}

	public async writeToDB(
		battleUsers: BattleSystem.BattleUser.Instance[] = Array.from(this.battleUsers.values()),
		traps: BattleSystem.Trap.Instance[] = Array.from(this.traps.values()),
		records: BattleSystem.Trap.Record.Instance[] = Array.from(this.trapRecords.values())
	) {
		await container.database.$transaction([
			...battleUsers.map((battleUser) => {
				return container.database.battleUser.upsert({
					where: {
						userId_guildId: {
							guildId: battleUser.guildId,
							userId: battleUser.userId
						}
					},
					create: {
						guildId: battleUser.guildId,
						info: battleUser.info,
						stats: battleUser.stats,
						userId: battleUser.userId
					},
					update: {
						guildId: battleUser.guildId,
						info: battleUser.info,
						stats: battleUser.stats,
						userId: battleUser.userId
					}
				})
			}),
			...traps.map((trap: BattleSystem.Trap.Instance) => {
				return container.database.battleTrap.upsert({
					where: {
						id: trap.id
					},
					create: {
						createdAt: trap.createdAt,
						phrase: trap.phrase,
						id: trap.id,
						state: trap.state,
						battleUserId: trap.battleUserId
					},
					update: {
						createdAt: trap.createdAt,
						phrase: trap.phrase,
						state: trap.state,
						battleUserId: trap.battleUserId
					}
				})
			}),
			...records.map((record: BattleSystem.Trap.Record.Instance) => {
				return container.database.battleTrapRecord.upsert({
					where: {
						id: record.id,
					},
					create: {
						type: record.type,
						guildId: record.guildId,
						id: record.id,
						trapId: record.trapId,
						payload: record.payload as Prisma.Prisma.JsonObject,
					},
					update: {
						type: record.type,
						guildId: record.guildId,
						trapId: record.trapId,
						payload: record.payload as Prisma.Prisma.JsonObject,
					}
				})
			})
		])
	}
}

export namespace BattleSystem {
	export namespace ScheduledTasks {
		export const Events = {
			RegenerateUsers: 'battleSystem.RegenerateUsers'
		}
	}

	export namespace Config {
		export interface Instance extends Omit<Omit<Prisma.BattleConfig, 'levelConfigs'>, 'abilityConfigs'> {
			levelConfigs: Collection<number, Prisma.BattleLevelConfig>;
			abilityConfigs: Collection<string, Prisma.BattleAbilityConfig>;

		}
	}
	export namespace BattleUser {
		export interface Instance extends Prisma.BattleUser {
			battleTraps: Collection<[trapId: string], Trap.Instance>
			getGuild(): Guild,
			getUser(): User,
			getActiveTraps(): Collection<[trapId: string], Trap.Instance>,
			level(): BattleLevelConfig
		}
	}

	export namespace Ability {
		export type Options<Type = BattleAbilityType> = Omit<BattleAbilityConfig, 'type'> & {
			type: Type
		}

		export type GulagOptions = Options<'Gulag'>;
		export type TrapOptions = Options<'Trap'>;
	}

	export namespace Trap {
		export interface Instance extends Prisma.BattleTrap {
			records: Collection<[recordId: string], Record.Instance>,
			obscuredPhrase: string,
			getBattleUser(): BattleUser.Instance,
			damage(): number,
			duration(): number,
			experience(): number
		}

		export namespace DamageFormula {
			export function BASE_DAMAGE(config: Config.Instance, trap: Instance) {
				const numWordsDamage = trap.phrase.split(' ').length * config.trapConfig.damage.wordScalar;
				const numCharactersDamage = trap.phrase.length * config.trapConfig.damage.numCharacterScalar;
				return numWordsDamage * numCharactersDamage;
			}

			export function WORDS_DAMAGE(config: Config.Instance, trap: Instance) {
				return trap.phrase.split(' ').length * config.trapConfig.damage.wordScalar;
			}

			export function CHARACTERS_DAMAGE(config: Config.Instance, trap: Instance) {
				return trap.phrase.length * config.trapConfig.damage.numCharacterScalar;
			}

			export function LINEAR(config: Config.Instance, trap: Instance) {
				const duration = trap.duration();
				const baseDamage = DamageFormula.BASE_DAMAGE(config, trap);
				return baseDamage + duration * config.trapConfig.damage.linearScalar!;
			}

			export function EXPONENTIAL(config: Config.Instance, trap: Instance) {
				const duration = trap.duration();
				const baseDamage = DamageFormula.BASE_DAMAGE(config, trap);
				return baseDamage + duration * config.trapConfig.damage.exponentialScalar!;
			}

			export function INTERVAL(config: Config.Instance, trap: Instance) {
				const duration = trap.duration();
				var durationIterator = duration;

				const intervals = config.trapConfig.damage.timeIntervals
					.sort((a, b) => a.intervalSecs - b.intervalSecs)

				var intervalDamage = intervals.reduce((sum, interval) => {
					const intervalAmount = (durationIterator > interval.intervalSecs)
						? interval.intervalSecs
						: interval.intervalSecs - (interval.intervalSecs - durationIterator)

					durationIterator -= (interval.intervalSecs > durationIterator)
						? durationIterator
						: interval.intervalSecs;

					return sum += intervalAmount * interval.damageScalar;
				}, 0);

				if (durationIterator > 0) {
					intervalDamage += durationIterator * intervals[intervals.length - 1].damageScalar;
				}

				const baseDamage = DamageFormula.BASE_DAMAGE(config, trap);
				return baseDamage + intervalDamage;
			}
		}

		export namespace ExperienceFormula {
			export function BASE_EXPERIENCE(config: Config.Instance, trap: Instance) {
				const numWordsDamage = trap.phrase.split(' ').length * config.trapConfig.damage.wordScalar;
				const numCharactersDamage = trap.phrase.length * config.trapConfig.damage.numCharacterScalar;
				return numWordsDamage * numCharactersDamage;
			}
		}

		export function DurationFormula(trap: Instance) {
			const timeSinceCreation = (Date.now() - trap.createdAt.getTime());
			if (trap.state === BattleTrapState.Armed) {
				return timeSinceCreation;
			} else {
				const record = trap.records.find(r =>
					r.type === BattleTrapRecordType.Disarm ||
					r.type === BattleTrapRecordType.Remove ||
					r.type === BattleTrapRecordType.Trigger
				)

				if (!record) {
					return timeSinceCreation;
				}

				let payload: Record.Payload.Disarm | Record.Payload.Remove | Record.Payload.Trigger

				if (record.type === BattleTrapRecordType.Disarm) {
					payload = record.payload as Record.Payload.Disarm;
					return (payload.disarmedAt - payload.createdAt);
				} else if (record.type === BattleTrapRecordType.Remove) {
					payload = record.payload as Record.Payload.Remove;
					return (payload.removedAt - payload.createdAt);
				} else if (record.type === BattleTrapRecordType.Trigger) {
					payload = record.payload as Record.Payload.Trigger;
					return (payload.firedAt - payload.createdAt);
				}
			}

			return timeSinceCreation;
		}

		export const Events = {
			Create: 'battleSystem.trap.create',
			Trigger: 'battleSystem.trap.trigger',
			Disarm: 'battleSystem.trap.disarm',
			Remove: 'battleSystem.trap.remove',
		}


		export namespace Record {
			export interface Instance extends Prisma.BattleTrapRecord {
				getTrap(): BattleSystem.Trap.Instance
			}

			export namespace Instance {
				export type Create = Instance & {
					payload: Payload.Create
				}
				export type Trigger = Instance & {
					payload: Payload.Trigger
				}
				export type Disarm = Instance & {
					payload: Payload.Disarm
				}
				export type Remove = Instance & {
					payload: Payload.Remove
				}
			}

			export namespace Payload {
				export type _BasePayload = {
					createdAt: number,
					owner: _BattleUserPayload
					config: {
						version: string
					}
				}
				export type _ExperiencePayload = {
					total: number,
					base: number,
					bonus?: number,
				}
				export type _InvocationPayload = {
					type: 'Message' | 'Interaction',
					messageId: string,
					interactionId?: string,
					channelId: string
				}
				export type _DamagePayload = {
					total: number,
					baseDamage: number,
					wordDamage: number,
					numCharactersDamage: number,
					durationDamage: number
				}
				export type _BattleUserPayload = {
					userId: string,
					battleUserId: string,
					experience: number,
					energy: number,
					health: number
				}

				export type Create = _BasePayload & {
					invocation: _InvocationPayload,
				}
				export type Trigger = _BasePayload & {
					damage: _DamagePayload,
					trigger: _InvocationPayload,
					experience: _ExperiencePayload,
					duration: number,
					firedAt: number,
					victim: _BattleUserPayload
				}
				export type Disarm = _BasePayload & {
					damage: _DamagePayload,
					duration: number,
					invocation: _InvocationPayload,
					disarmedAt: number,
					experience: _ExperiencePayload,
					disarmer: _BattleUserPayload
				}
				export type Remove = _BasePayload & {
					damage: _DamagePayload,
					invocation: _InvocationPayload,
					duration: number,
					removedAt: number,
					experience: _ExperiencePayload,
				}
			}
		}
	}
}

