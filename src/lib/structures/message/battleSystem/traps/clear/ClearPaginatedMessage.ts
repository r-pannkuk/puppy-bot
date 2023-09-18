import { BattleTrapState } from "@prisma/client";
import { ButtonStyle, Collection, ComponentType, Message, User } from "discord.js";
import { Emojis } from "../../../../../utils/constants";
import type { PaginatedMessageActionButton, PaginatedMessageActionContext } from '@sapphire/discord.js-utilities';
import type { BattleSystem } from "../../../../managers/BattleSystem";
import { ListPaginatedMessage, InteractionIds as Ids } from "../list/ListPaginatedMessage";


export enum _InteractionIds {
	Clear = 'ClearPaginatedMessage.clearTrap'
}

export const InteractionIds = { ..._InteractionIds, ...Ids }

export class ClearPaginatedMessage extends ListPaginatedMessage {
	protected originalTrapIds?: [trapId: string][]
	protected selectMenuOptionsFunction = (pageIndex) => {
		if (pageIndex === 0) {
			return {
				label: 'All'
			}
		} else {
			const trap = this.originalTraps?.at(pageIndex - 1);
			return {
				label: trap?.phrase ?? `NOT_FOUND`,
				description: trap?.damage().toString() ?? `NOT_FOUND`,
			}
		}
	}

	public static clearAction : PaginatedMessageActionButton = {
		customId: InteractionIds.Clear,
		type: ComponentType.Button,
		emoji: Emojis.CrossMark,
		style: ButtonStyle.Danger,
	}

	protected get originalTraps() {
		return this.guild?.battleSystem.traps.filter((trap) => this.originalTrapIds?.indexOf(trap.id as unknown as [trapId: string]) !== -1)
	}

	public constructor(options: ClearPaginatedMessage.Options) {
		const clearAction = {
			...ClearPaginatedMessage.clearAction,
			run: async ({ handler, interaction } : PaginatedMessageActionContext) => {
				let paginatedMessage = handler as ClearPaginatedMessage;

				const trap = this.originalTraps?.at(paginatedMessage.index);

				if (!trap) return;

				if (trap.state === BattleTrapState.Armed) {
					const currentIndex = paginatedMessage.index;
					await this.guild?.battleSystem.removeTrap(paginatedMessage.response as Message, trap);

					const records = this.originalTraps?.reduce((collection, trap) => {
						const record = trap.records.last();
						if (record) return collection.set(record.id as unknown as [recordId: string], record);
						return collection;
					}, new Collection<[recordId: string], BattleSystem.Trap.Record.Instance>())
					paginatedMessage.setPages([]);
					paginatedMessage.generateRecordEmbeds(records);
					paginatedMessage.setIndex(currentIndex);

					paginatedMessage.generateSelectMenuOptions();
					await paginatedMessage.run(interaction);
				}
			}
		};

		super({
			...options,
			recordFilter: (record) => {
				const trap = record.getTrap();

				return trap.getBattleUser().userId === options.user.id &&
					trap.state === BattleTrapState.Armed
			},
			recordSorter: (a, b) => {
				const trapA: BattleSystem.Trap.Instance = a.getTrap();
				const trapB: BattleSystem.Trap.Instance = b.getTrap();

				return trapB.duration() - trapA.duration();
			}
		})

		this.originalTrapIds = this.records?.map((record) => record.trapId as unknown as [trapId: string]);

		this.addAction(clearAction);

		if (this.traps) {
			const actions = Array.from(this.actions.values()).sort((a, b) => {
				var sort = {}
				sort[InteractionIds.PreviousPage] = 1;
				sort[InteractionIds.Clear] = 2;
				sort[InteractionIds.NextPage] = 3;
				sort[InteractionIds.GoToPage] = 4;

				return sort[a['customId']] - sort[b['customId']]
			})

			this.setActions(actions);
		}
	}
}

export namespace ClearPaginatedMessage {
	export type Options = Omit<Omit<ListPaginatedMessage.Options, 'recordFilter'>, 'recordSorter'> & {
		user: User
	}
}
