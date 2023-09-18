import { ApplyOptions } from '@sapphire/decorators';
import { Command, Precondition } from '@sapphire/framework'
import type { ChatInputCommandInteraction, Message } from 'discord.js'
import 'dotenv/config'
import { envParseArray } from '../lib/env/utils';

@ApplyOptions<Precondition.Options>({
    name: 'OwnerOnly'
})
export class OwnerOnlyPrecondition extends Precondition {
    public override async messageRun(message: Message) {
        return this.checkOwner(message.author.id);
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction) {
        return this.checkOwner(interaction.user.id);
    }

    public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction) {
        return this.checkOwner(interaction.user.id);
    }

    public async checkOwner(userId: string) {
        return envParseArray('CLIENT_OWNERS').includes(userId)
            ? this.ok()
            : this.error({
                message: `Only the bot owner can use this command.`
            })
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
        OwnerOnly: never
    }
}