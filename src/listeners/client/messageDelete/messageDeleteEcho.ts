import { ApplyOptions } from '@sapphire/decorators';
import { container, Events, Listener } from '@sapphire/framework';
import { PartialMessage, TextChannel, type Message } from 'discord.js';


@ApplyOptions<Listener.Options>({
    event: Events.MessageDelete
})
export class MessageDeleteEcho extends Listener<typeof Events.MessageDelete> {
    public override async run(message: Message<boolean> | PartialMessage) {
        if (!message.guild?.messageEchoer.echoDeletes) return;

        if (!message.channel.isTextBased()) return;

        if (message.author === container.client.user || message.author?.bot) return;

        if (message.content?.indexOf(`${message.guild.settings.prefix}trap`) === 0) {
            return;
        }

        const echoChannel = message.guild.messageEchoer.outputChannel;

        const createdDate = new Date(message.createdTimestamp);
        const formatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
        }).format(createdDate).replace(',', '');
        var content = `(${formatted}) \`DELETED\` message from **${message.author?.username}** [${message.channel}]:\n`
        content += `${message.url}\n`;
        content += `${message.content}`;
        if(echoChannel instanceof TextChannel) {
            echoChannel?.send({
                embeds: message.embeds,
                components: message.components,
                files: Array.from(message.attachments.values()),
                content
            })
        }
    }
}