import { BattleTrapState } from "@prisma/client";
import { Constants, MessageEmbed } from "discord.js";
import { default as durationStringDetailed } from "pretty-ms";
import type { BattleSystem } from "../../../../managers/BattleSystem";
import { BattleTrap } from "../BattleTrapPaginatedMessage";
import { CheckEmbed } from "./CheckEmbed";

export enum _InteractionIds {
	GoToPage = 'CheckPaginatedMessage.goToPage',
}

export const InteractionIds = { ..._InteractionIds, ...BattleTrap.InteractionIds };

export class CheckPaginatedMessage extends BattleTrap.TrapPaginatedMessage {
	protected battleUserId?: [battleUserId: string];

	protected get battleUser() { return this.guild?.battleSystem.battleUsers.get(this.battleUserId ?? "" as unknown as [battleUserId: string]) }

	public constructor(options: CheckPaginatedMessage.Options) {
		super({
			...options
		})

		if(options.battleUser) {
			this.battleUserId = options.battleUser.id as unknown as [battleUserId: string];
		}

		
		if (!this.battleUser) {this.addPageEmbed(new MessageEmbed({
			title: `User Not Found`,
			description: `This user was not found when searching.  This is an error that shouldn't happen!.`
		}))
		return;
		}

		const validTraps = this.battleUser?.battleTraps.filter((trap) => trap.state === BattleTrapState.Armed)

		if(validTraps!.size === 0) {
			this.addPageEmbed(new MessageEmbed({
				title: `No Trap Found`,
				description: `No traps were found for this user.  Please create a trap using the \`\`/trap create\`\` command.`
			}))
			return;
		}

		if (validTraps.size > 1) {
			this.addAction({
				customId: InteractionIds.GoToPage,
				type: Constants.MessageComponentTypes.SELECT_MENU,
				placeholder: "Select Active Trap...",
				run: ({ handler, interaction }) => {
					if (interaction.isSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
						handler.index = parseInt(interaction.values[0], 10);
					}
				}
			});

			this.setSelectMenuOptions((pageIndex) => {
				const trap = validTraps
					.filter((trap) => trap.state === BattleTrapState.Armed)
					.sort((a, b) => b.duration() - a.duration())
					.at(pageIndex - 1);

				if (!trap) return { label: `ERROR: No trap found.` }

				return {
					label: trap.phrase,
					description: durationStringDetailed(trap.duration()),
				}
			})
		}

		validTraps
			.sort((a, b) => b.duration() - a.duration())
			.forEach((trap) => {
				this.addPageEmbed(new CheckEmbed({
					trap: trap
				}))
			})
	}
}
export namespace CheckPaginatedMessage {
	export type Options = BattleTrap.TrapPaginatedMessage.Options & {
		battleUser: BattleSystem.BattleUser.Instance,
	}
}