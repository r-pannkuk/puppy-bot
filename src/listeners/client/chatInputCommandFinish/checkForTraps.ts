import { BattleTrapRecordType, BattleTrapState } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommandRunPayload, Command, Events, Listener } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import type { BattleSystem } from "../../../lib/structures/managers/BattleSystem";

@ApplyOptions<Listener.Options>({
    event: Events.ChatInputCommandRun,
})
export class ChatInputCommandFinishCheckForTraps extends Listener {
    public async run(interaction: ChatInputCommandInteraction, command: Command, payload: ChatInputCommandRunPayload) {
        if (!interaction.inGuild()) return;
        if (interaction.user.id === this.container.client.user!.id) return;
        if (interaction.user.bot) return;

        const guild = interaction.guild;
        const content = [
            command.name.toLowerCase(),
            ...Array.from(payload.interaction.options.data.values())
                .map((option) => option.value?.toString() ?? ``)
        ]
        const matches = guild?.battleSystem.traps.filter((trap) => {
            if (trap.state !== BattleTrapState.Armed) return false;
            if (!content.some((c) => c.indexOf(trap.phrase))) return false;

            const recordCreated = trap.records.find((r) => r.type === BattleTrapRecordType.Create)!;
            const payload = recordCreated.payload as BattleSystem.Trap.Record.Payload.Create;

            return payload.invocation.interactionId !== interaction.id;
        })

        matches?.forEach((trap) => {
            if (interaction.commandName === 'trap' && interaction.token.indexOf('disarm') !== -1) {
                guild?.battleSystem.disarmTrap(interaction, trap);
            } else {
                guild?.battleSystem.triggerTrap(interaction, trap);
            }
        })
    }
}