/**
 * @file Stop.ts
 * @description `/stop` command — stops playback and disconnects the bot from voice.
 *
 * Leaves the Lavalink voice channel, which destroys the Shoukaku Player,
 * and clears the guild's music queue.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';

const SHORT_DESCRIPTION = 'Stops playback and disconnects the bot from voice.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'stop',
    aliases: [],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class StopCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) => builder.setName(this.name).setDescription(this.description),
            this.slashCommandOptions,
        );
    }

    public async stop(messageOrInteraction: Message | ChatInputCommandInteraction): Promise<void> {
        const { client } = this.container;
        const guildId = messageOrInteraction.guildId!;

        const embed = new EmbedBuilder().setColor('Blurple').setTitle('Music').setDescription('⏹️ Stopped and disconnected.');

        client.musicPlayer.leaveVoiceChannel(guildId);
        client.musicQueue.delete(guildId);

        if (messageOrInteraction instanceof Message) {
            if (messageOrInteraction.channel.isSendable()) {
                await messageOrInteraction.channel.send({ embeds: [embed] });
            }
        } else {
            await messageOrInteraction.reply({ embeds: [embed] });
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await this.stop(interaction);
    }

    public override async messageRun(message: Message, _input: Args) {
        await this.stop(message);
    }
}