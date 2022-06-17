import { BattleTrapRecordType } from "@prisma/client";
import { container } from "@sapphire/framework";
import type { GuildTextBasedChannel, MessageEmbedOptions } from "discord.js";
import { default as durationStringDetailed } from "pretty-ms";
import type { BattleSystem } from "../../../managers/BattleSystem";
import { BattleTrap as BT } from "./BattleTrapEmbed";

export class RecordEmbed extends BT.Embed {
	protected recordId?: [recordId: string];
	public get record() { return this.trap?.records.get(this.recordId ?? "" as unknown as [recordId: string]); }

	public get stringifyType() { return `**Type**: ${this.record?.type}` }
	public get stringifyPayload() {
		if (this.record?.type === BattleTrapRecordType.Create) {
			const payload = this.record.payload as BattleSystem.Trap.Record.Payload.Create;
			return {
				channel: `**Channel**: ${this.guild?.channels.cache.get(payload.invocation.channelId)}`,
			}
		}
		if (this.record?.type === BattleTrapRecordType.Disarm) {
			const payload = this.record.payload as BattleSystem.Trap.Record.Payload.Disarm;
			return {
				damage: `**Damage Yield**: ${payload.damage.total}`,
				date: `**Disarm Date**: ${new Date(payload.disarmedAt)}`,
				disarmer: `**Disarmer**: ${container.client.users.cache.get(payload.disarmer.userId)}`,
				duration: `**Time Alive**: ${durationStringDetailed(payload.duration)}`,
				experience: `**Experience**: ${payload.experience.total}`,
				URL: `${(this.guild?.channels.cache.get(payload.invocation.channelId) as GuildTextBasedChannel)?.messages.cache.get(payload.invocation.messageId)?.url}`,
			}
		}
		if (this.record?.type === BattleTrapRecordType.Remove) {
			const payload = this.record.payload as BattleSystem.Trap.Record.Payload.Remove;
			return {
				damage: `**Damage Yield**: ${payload.damage.total}`,
				date: `**Removed Date**: ${new Date(payload.removedAt)}`,
				duration: `**Time Alive**: ${durationStringDetailed(payload.duration)}`,
				experience: `**Experience**: ${payload.experience.total}`,
				URL: `${(this.guild?.channels.cache.get(payload.invocation.channelId) as GuildTextBasedChannel)?.messages.cache.get(payload.invocation.messageId)?.url}`,
			}
		}
		if (this.record?.type === BattleTrapRecordType.Trigger) {
			const payload = this.record.payload as BattleSystem.Trap.Record.Payload.Trigger;
			payload
			return {
				damage: `**Damage Yield**: ${payload.damage.total}`,
				date: `**Trigger Date**: ${new Date(payload.firedAt)}`,
				victim: `**Victim**: ${container.client.users.cache.get(payload.victim.userId)}`,
				duration: `**Time Alive**: ${durationStringDetailed(payload.duration)}`,
				experience: `**Experience**: ${payload.experience.total}`,
				URL: `${(this.guild?.channels.cache.get(payload.trigger.channelId) as GuildTextBasedChannel)?.messages.cache.get(payload.trigger.messageId)?.url}`,
			}
		}

		return undefined;
	}

	public constructor(options: RecordEmbed.Options) {
		super({
			...options,
			trap: options.record?.getTrap()
		});

		if (options.record) {
			this.recordId = options.record.id as unknown as [trapId: string];
			this.trapId = options.record.trapId as unknown as [trapId: string];
		}
	}

	public async setRecord(record: BattleSystem.Trap.Record.Instance | string) {
		if (typeof record !== 'string') {
			this.recordId = record.id as unknown as [recordId: string];
			this.trapId = record.trapId as unknown as [trapId: string];
		} else {
			this.recordId = record as unknown as [recordId: string];
		}
	}
}

export namespace RecordEmbed {
	export type Options = MessageEmbedOptions & {
		record: BattleSystem.Trap.Record.Instance
	}
}