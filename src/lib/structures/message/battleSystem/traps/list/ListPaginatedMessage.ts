import { Collection, ComponentType, EmbedBuilder } from "discord.js";
import type { BattleSystem } from "../../../../managers/BattleSystem";
import { BattleTrap } from "../BattleTrapPaginatedMessage";
import { ListEmbed } from "./ListEmbed";

export class ListPaginatedMessage extends BattleTrap.TrapPaginatedMessage {
	protected recordFilter?: (record: BattleSystem.Trap.Record.Instance) => boolean;
	protected recordSorter?: (a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance) => number;
	protected selectMenuOptionsFunction = (pageIndex) => {
		if (pageIndex === 0) {
			return {
				label: 'All'
			}
		} else {
			const trap = this.records?.at(pageIndex - 1)?.getTrap();
			return {
				label: trap?.phrase ?? `NOT_FOUND`,
				description: trap?.damage().toString() ?? `NOT_FOUND`,
			}
		}
	}

	public get traps() {
		const filteredRecords = this.records;
		return this.guild?.battleSystem.traps
			.filter(trap => filteredRecords?.hasAny(...trap.records.keys()) ?? false)
	}

	public get records() {
		return this.guild?.battleSystem.trapRecords
			.filter(this.recordFilter ?? (() => true))
			.sort(this.recordSorter ?? (() => 0))
	}

	public constructor(options: ListPaginatedMessage.Options) {
		super({
			...options
		})

		if (options.recordFilter) {
			this.recordFilter = options.recordFilter;
		}

		if (options.recordSorter) {
			this.recordSorter = options.recordSorter;
		}

		if (!this.traps || this.traps.size === 0) {
			this.addPageEmbed(new EmbedBuilder({
				title: `No traps found.`,
				description: `No traps were found for this user.  Please create a trap using the \`\`/trap create\`\` command.`
			}))
			return;
		}
		
		this.addAction({
			customId: InteractionIds.GoToPage,
			type: ComponentType.StringSelect,
			options: [{
				label: "Filling...",
				value: "TBD",
			}],
			placeholder: "Select Trap...",
			run: ({ handler, interaction }) => {
				if (interaction.isStringSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
					handler.index = parseInt(interaction.values[0], 10);
				}
			}
		});


		this.generateSelectMenuOptions();
		this.generateRecordEmbeds();
	}

	public generateSelectMenuOptions() {
		if (this.traps) {
			this.setSelectMenuOptions(this.selectMenuOptionsFunction)
		}
	}

	public generateRecordEmbeds(records?: Collection<[recordId: string], BattleSystem.Trap.Record.Instance>) {
		if(!records) {
			records = this.records;
		}
		
		records?.forEach((record) => {
			this.addPageEmbed(new ListEmbed({
				record: record,
			} as ListEmbed.Options))
		})
	}

	public async setFilter(filter: (record: BattleSystem.Trap.Record.Instance) => boolean) {
		this.recordFilter = filter;
	}

	public async setSorter(sorter: (a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance) => number) {
		this.recordSorter = sorter;
	}
}
export namespace ListPaginatedMessage {
	export type Options = BattleTrap.TrapPaginatedMessage.Options & {
		recordFilter(record: BattleSystem.Trap.Record.Instance): boolean;
		recordSorter(a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance): number;
	}
}

export enum _InteractionIds {
	GoToPage = 'ListPaginatedMessage.goToPage',
}

export const InteractionIds = { ..._InteractionIds, ...BattleTrap.InteractionIds };
