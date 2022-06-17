import { ListHiddenEmbed } from "./ListHiddenEmbed";
import { ListPaginatedMessage } from "./ListPaginatedMessage"

export class ListHiddenPaginatedMessage extends ListPaginatedMessage {
	public constructor(options: ListHiddenPaginatedMessage.Options) {
		super({
			...options
		})

		
	}

	public override async generateSelectMenuOptions() {
		if (this.traps && this.traps.size > 1) {
			this.setSelectMenuOptions((pageIndex) => {
				if (pageIndex === 0) {
					return {
						label: 'All'
					}
				} else {
					const trap = this.records?.at(pageIndex - 1)?.getTrap();
					return {
						label: trap?.obscuredPhrase ?? `NOT_FOUND`,
						description: trap?.damage().toString() ?? `NOT_FOUND`,
					}
				}
			})
		}
	}

	public override async generateRecordEmbeds(): Promise<void> {
		this.records?.forEach((record) => {
			this.addPageEmbed(new ListHiddenEmbed({
				record: record,
			} as ListHiddenEmbed.Options))
		})
	}
}
export namespace ListHiddenPaginatedMessage {
	export type Options = ListPaginatedMessage.Options & {
	}
}