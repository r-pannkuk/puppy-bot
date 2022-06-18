import { container } from "@sapphire/framework";
import { Guild, MessageEmbedOptions } from "discord.js";
import prettyMs from "pretty-ms";
import type { BattleSystem } from "../../../managers/BattleSystem";
import { PuppyBotEmbed } from "../../PuppyBotEmbed";

export namespace BattleTrap {
	export abstract class Embed extends PuppyBotEmbed {
		protected trapId?: [trapId: string];
		protected guildId?: string;

		public get guild() { return container.client.guilds.cache.get(this.guildId ?? ""); }
		public get trap() { return this.guild?.battleSystem.traps.get(this.trapId ?? "" as unknown as [trapId: string]); }

		public get stringifyPhrase() { return `**Phrase**: ${this.trap?.phrase}` }
		public get stringifyPhraseObscured() { return `**Phrase**: ${this.trap?.obscuredPhrase}`}
		public get stringifyStatus() { return `**Status**: ${this.trap?.state}` }
		public get stringifyOwner() { return `**Owner**: ${this.trap?.getBattleUser().getUser()}` }
		public get stringifyDamage() { return `**Damage**: ${this.trap?.damage()}` }
		public get stringifyDuration() { return `**Duration**: ${prettyMs(this.trap?.duration() ?? 0)}` }
		public get stringifyCreatedAt() { return `**Created At**: ${new Date(this.trap?.createdAt ?? 0)}` }
		public get stringifyAbilityCost() { return `**Energy Cost**: ${this.guild?.battleSystem.config.abilityConfigs.get('Trap')?.reqEnergy}`}

		public static readonly DefaultFooter = `*Traps deal more damage the longer they are alive for.*`;

		public constructor(options: Embed.Options) {
			super(options);

			if(options.trap) {
				this.guildId = options.trap.getBattleUser().guildId;
				this.trapId = options.trap.id as unknown as [trapId: string];
			}
		}

		public async setGuild(guild: Guild | string) {
			if(guild instanceof Guild) {
				this.guildId = guild.id;
			} else {
				this.guildId = guild;
			}
		}
	}

	export namespace Embed {
		export type Options = MessageEmbedOptions & {
			trap: BattleSystem.Trap.Instance,
		}
	}
}