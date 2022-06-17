import type { ApplicationCommandRegistry, ChatInputCommandContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../lib/structures/command/PuppyBotCommand';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'ping',
    aliases: ['pong'],
    description: 'Returns the current latency with the bot.'
})
export class PingCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry);
    }
    
    public async messageRun(message: Message) {
        const msg = await message.channel.send('Ping?');

        const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${msg.createdTimestamp - message.createdTimestamp}ms.`;

        return msg.edit(content);
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        await interaction.reply('Ping?');

        const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${interaction.createdTimestamp - Date.now()}ms.`;

        await interaction.editReply(content);
    }
}