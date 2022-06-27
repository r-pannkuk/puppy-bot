import type { IGuildManager } from "../IGuildManager";
import { default as config } from "../../../../config/default/PathfinderSheetConfig.json"
import type { IConfigLoader } from "../IConfigLoader";
import { Collection, Guild } from "discord.js";
import { container } from "@sapphire/framework";
import type { PathfinderCharacterConfig, PathfinderSheetConfig } from "@prisma/client";
import { envParseString } from "../../../env/utils";
import { GoogleSpreadsheet } from 'google-spreadsheet';

const DEFAULT_CONFIG = {
	...config,
};

export class PathfinderSheetLinker implements IGuildManager, IConfigLoader<PathfinderSheetConfig> {
	protected guildId: string;
	public get guild(): Guild {
		return container.client.guilds.cache.get(this.guildId)!;
	}

	protected static googleAuth = {
		client_email: envParseString('GOOGLE_ACCOUNT_EMAIL'),
		private_key: envParseString('GOOGLE_PRIVATE_KEY'),
	};

	protected _config: PathfinderSheetConfig | undefined = undefined;
	public get config(): PathfinderSheetLinker.Config.Instance {
		return {
			...this._config!,
		}
	}

	private cache: Collection<string, PathfinderSheetLinker.Character.Instance>;

	public constructor(guild: Guild) {
		this.guildId = guild.id;
		this.cache = new Collection();
	}

	public async linkCharacter(characterConfig: {
		id?: string,
		sheetUrl: string,
		ownerId: string,
		name?: string,
		lastUpdated?: Date,
	}) {
		const doc = new GoogleSpreadsheet(characterConfig.sheetUrl);

		await doc.useServiceAccountAuth(PathfinderSheetLinker.googleAuth);

		await doc.loadInfo();

		const sheet = doc.sheetsByTitle[this.config.sheetName];

		var character: Omit<PathfinderSheetLinker.Character.Instance, 'id'> = {
			...characterConfig,
			abilities: {
				charisma: 0,
				constitution: 0,
				dexterity: 0,
				intelligence: 0,
				strength: 0,
				wisdom: 0,
			},
			cmb: 0,
			defenses: {
				"flat-footed": 0,
				ac: 0,
				cmd: 0,
				touch: 0,
			},
			health: 0,
			initiative: 0,
			lastUpdated: new Date(Date.now()),
			name: "",
			offenses: [
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				},
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				},
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				},
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				},
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				},
				{
					attack: [],
					crit: "",
					damage: "",
					multiplier: 0,
					name: "",
					range: 0,
					type: ""
				}
			],
			saves: {
				fortitude: 0,
				reflex: 0,
				will: 0,
			},
			skills: {
				Acrobatics: 0,
				Appraise: 0,
				Bluff: 0,
				Climb: 0,
				Diplomacy: 0,
				"Disable Device": 0,
				Disguise: 0,
				"Escape Artist": 0,
				Fly: 0,
				"Handle Animal": 0,
				Heal: 0,
				Intimidate: 0,
				"Knowledge Spheric": 0,
				"Knowledge Dungeoneering": 0,
				"Knowledge Engineering": 0,
				"Knowledge Geography": 0,
				"Knowledge History": 0,
				"Knowledge Local": 0,
				"Knowledge Nature": 0,
				"Knowledge Nobility": 0,
				"Knowledge Religion": 0,
				Linguistics: 0,
				Perception: 0,
				Piloting: 0,
				Ride: 0,
				"Sense Motive": 0,
				"Sleight of Hand": 0,
				"Spheric Combat": 0,
				Stealth: 0,
				Survival: 0,
				Swim: 0,
				Craft: 0,
				Artistry: 0,
				Lore: 0,
				Perform: 0,
				Prof: 0
			},
			totals: {
				bab: 0,
				level: 0,
			},
		};

		for (var key of Object.keys(character)) {
			if (character[key] instanceof Array) {
				for (var i in character[key]) {
					for (var key2 of Object.keys(character[key][i])) {
						character[key][i][key2] = sheet.getCellByA1(this.config.schema![key][i][key2]);
					}
				}
			} else if (typeof character[key] === 'object') {
				for (var key2 of Object.keys(character[key])) {
					character[key][key2] = sheet.getCellByA1(this.config.schema![key2]);
				}
			} else {
				character[key] = sheet.getCellByA1(this.config.schema![key]);
			}
		}

		console.log(character);

		const upsertedCharacterConfig = await container.database.pathfinderCharacterConfig.upsert({
			where: {
				id: characterConfig.id,
			},
			create: {
				...characterConfig,
				name: character.name,
				lastUpdated: new Date(Date.now()),
			},
			update: {
				...characterConfig,
				name: character.name,
				lastUpdated: new Date(Date.now()),
			}
		});

		this.cache.set(upsertedCharacterConfig.id, {
			...upsertedCharacterConfig,
			...character,
		} as PathfinderSheetLinker.Character.Instance);

		return this.cache.get(upsertedCharacterConfig.id)!;
	}

	public async loadConfig(): Promise<void> {
		var loadedConfig = await container.database.pathfinderSheetConfig.findFirst({
			where: {
				guildId: {
					equals: this.guild.id
				}
			},
			orderBy: {
				version: 'desc',
			}
		});

		if (!loadedConfig || loadedConfig.version < DEFAULT_CONFIG.version) {
			loadedConfig = await container.database.pathfinderSheetConfig.create({
				data: {
					...DEFAULT_CONFIG,
					guildId: this.guild.id,
				}
			});
		}

		this._config = loadedConfig;
	}

	public async loadCharacters() {
		const loadedCharacters = await container.database.pathfinderCharacterConfig.findMany({
			where: {
				ownerId: {
					in: this.guild.members.cache.map((member) => member.user.id)
				}
			}
		});

		for(var character of loadedCharacters) {
			await this.linkCharacter(character);
		}
	}

}

export namespace PathfinderSheetLinker {
	export namespace Config {
		export type Instance = PathfinderSheetConfig & {

		}
	}

	export namespace Character {
		export type Instance = PathfinderCharacterConfig & {
			totals: {
				bab: number,
				level: number,
			},
			health: number,
			skills: {
				Acrobatics: number,
				Appraise: number,
				Bluff: number,
				Climb: number,
				Diplomacy: number,
				"Disable Device": number,
				Disguise: number,
				"Escape Artist": number,
				Fly: number,
				"Handle Animal": number,
				Heal: number,
				Intimidate: number,
				"Knowledge Spheric": number,
				"Knowledge Dungeoneering": number,
				"Knowledge Engineering": number,
				"Knowledge Geography": number,
				"Knowledge History": number,
				"Knowledge Local": number,
				"Knowledge Nature": number,
				"Knowledge Nobility": number,
				"Knowledge Religion": number,
				Linguistics: number,
				Perception: number,
				Piloting: number,
				Ride: number,
				"Sense Motive": number,
				"Sleight of Hand": number,
				"Spheric Combat": number,
				Stealth: number,
				Survival: number,
				Swim: number,
				Craft: number,
				Artistry: number,
				Lore: number,
				Perform: number,
				Prof: number
			},
			abilities: {
				strength: number,
				dexterity: number,
				constitution: number,
				intelligence: number,
				wisdom: number,
				charisma: number,
			},
			saves: {
				fortitude: number,
				reflex: number,
				will: number,
			},
			defenses: {
				ac: number,
				"flat-footed": number,
				touch: number,
				cmd: number
			},
			offenses: {
				name: string,
				attack: number[],
				damage: string,
				crit: string,
				multiplier: number,
				range: number,
				type: string,
			}[],
			cmb: number,
			initiative: number
		}
	}
}