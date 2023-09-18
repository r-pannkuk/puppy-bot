import { BattleTrapRecordType, BattleTrapState } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import { ChannelType, type Message } from "discord.js";
import type { BattleSystem } from "../../../lib/structures/managers/BattleSystem";

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate
})
export class MessageCreateCheckForTraps extends Listener<typeof Events.MessageCreate> {
    public async run(message: Message) {
        if (message.channel.type !== ChannelType.GuildText &&
            message.channel.type !== ChannelType.PublicThread) {
            return;
        }

        if (message.author.id === this.container.client.user!.id) {
            return;
        }

        if (message.author.bot) {
            return;
        }

        const guild = message.guild;
        const content = message.content.toLowerCase();
        const prefix = await this.container.client.fetchPrefix(message);
        const matches = guild?.battleSystem.traps.filter((trap) => {
            if(trap.state !== BattleTrapState.Armed) return false;
            if(content.indexOf(trap.phrase) === -1) return false;

            const recordCreated = trap.records.find((r) => r.type === BattleTrapRecordType.Create)!;
            const payload = recordCreated.payload as BattleSystem.Trap.Record.Payload.Create;
            
            return payload.invocation.messageId !== message.id;
        })

        matches?.forEach((trap) => {
            if(message.content.indexOf(`${prefix}disarm`) === 0) {

            } else {
                guild?.battleSystem.triggerTrap(message, trap);
            }
        })
    }
}