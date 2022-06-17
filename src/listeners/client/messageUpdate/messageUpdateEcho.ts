import { ApplyOptions } from '@sapphire/decorators';
import { container, Events, Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

const moment = require('moment-timezone');


@ApplyOptions<Listener.Options>({
    event: Events.MessageUpdate
})
export class MessageUpdateEcho extends Listener<typeof Events.MessageUpdate> {
    public async run(before: Message, after: Message) {
        if (!after.guild?.messageEchoer.echoEdits) return;

        if (!after.channel.isText()) return;

        if (after.author === container.client.user || after.author.bot) return;

        if (before.content.indexOf(`${before.guild?.settings.prefix}trap`) === 0) {
            return;
        }

        if(before.content === after.content) return;

        const echoChannel = after.guild.messageEchoer.outputChannel;

        var editedDate = new Date(after.editedTimestamp!);
        var m = moment.tz(editedDate, 'America/New_York');
        var content = `(${m.format('YYYY-MM-DD h:mm:ss a')}) \`UPDATED\` message from **${before.author.username}** [${before.channel}]:\n`;
        content += `${after.url}\n`
        content += `> ${before.content.split('\n').join('\n> ')}\n`;
        content += `${after.content}`
        await echoChannel?.send({
            content: content,
            embeds: []
        });
    }
}