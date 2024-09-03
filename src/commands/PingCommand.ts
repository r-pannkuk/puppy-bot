import type { ApplicationCommandRegistry, ChatInputCommandContext } from '@sapphire/framework';
import { TextChannel, type ChatInputCommandInteraction, type Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../lib/structures/command/PuppyBotCommand';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'ping',
    aliases: ['pong'],
    description: 'Returns the current latency with the bot.'
})
export class PingCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
            ,
            this.slashCommandOptions
        )
    }

    public async messageRun(message: Message) {
        if(message.channel instanceof TextChannel) {
            const msg = await message.channel.send('Ping?');

            const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${msg.createdTimestamp - message.createdTimestamp}ms.`;

            await msg.edit(content);
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await interaction.reply('Ping?');

        const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${interaction.createdTimestamp - Date.now()}ms.`;

        await interaction.editReply(content);
    }
}