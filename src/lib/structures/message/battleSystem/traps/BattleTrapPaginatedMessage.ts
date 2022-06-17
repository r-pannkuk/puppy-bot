import { PaginatedMessage, PaginatedMessageOptions } from "@sapphire/discord.js-utilities";
import { container } from "@sapphire/framework";
import { Constants, Guild } from "discord.js";
import { Emojis } from "../../../../utils/constants";

export namespace BattleTrap {
	export abstract class TrapPaginatedMessage extends PaginatedMessage {
		protected guildId?: string;
		protected get guild() { return container.client.guilds.cache.get(this.guildId ?? ""); };

		public constructor(options: TrapPaginatedMessage.Options) {
			super({
				actions: options.actions ?? [
					{
						customId: InteractionIds.PreviousPage,
						style: 'PRIMARY',
						emoji: Emojis.ArrowLeft,
						type: Constants.MessageComponentTypes.BUTTON,
						run: ({ handler }) => {
							if (handler.index === 0) {
								handler.index = handler.pages.length - 1;
							} else {
								--handler.index;
							}
						}
					},
					{
						customId: InteractionIds.NextPage,
						style: 'PRIMARY',
						emoji: Emojis.ArrowRight,
						type: Constants.MessageComponentTypes.BUTTON,
						run: ({ handler }) => {
							if (handler.index === handler.pages.length - 1) {
								handler.index = 0;
							} else {
								++handler.index;
							}
						}
					}
				],
				...options
			})

			if (options.guild) {
				this.guildId = options.guild.id;
			}
		}

		public async setGuild(guild: Guild | string) {
			if (guild instanceof Guild) {
				this.guildId = guild.id;
			} else {
				this.guildId = guild;
			}
		}

	}

	export namespace TrapPaginatedMessage {
		export type Options = PaginatedMessageOptions & {
			guild: Guild
		}
	}

	export enum InteractionIds {
		PreviousPage = 'BattleTrapPaginatedMessage.previousPage',
		NextPage = 'BattleTrapPaginatedMessage.nextPage'
	}
}