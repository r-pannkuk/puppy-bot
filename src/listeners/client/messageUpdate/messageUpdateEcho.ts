import { ApplyOptions } from '@sapphire/decorators';
import { container, Events, Listener } from '@sapphire/framework';
import type { Message, PartialMessage } from 'discord.js';


@ApplyOptions<Listener.Options>({
    event: Events.MessageUpdate
})
export class MessageUpdateEcho extends Listener<typeof Events.MessageUpdate> {
    public async run(before: Message | PartialMessage, after: Message) {
        if (!after.guild?.messageEchoer?.echoEdits) return;

        if (!after.channel.isTextBased()) return;

        if (after.author === container.client.user || after.author?.bot) return;

        if (before.content?.indexOf(`${before.guild?.settings.prefix}trap`) === 0) {
            return;
        }

        if(before.content === after.content) return;

        const echoChannel = after.guild.messageEchoer.outputChannel;

        const editedDate = new Date(after.editedTimestamp!);
        const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
        }).format(editedDate).replace(',', '');
        const content = `(${formatted}) \`UPDATED\` message from **${before.author?.username ?? 'Unknown'}** [${before.channel}]:\n`
            + `${after.url}\n`
            + `> ${(before.content ?? '').split('\n').join('\n> ')}\n`
            + `${after.content}`;
        await echoChannel?.send({
            content: content,
            embeds: []
        });
    }
}