/**
 * @file Seek.ts
 * @description `/seek` command — seeks to a specific position in the current track.
 *
 * Accepts a time in seconds and delegates to `player.seekTo(ms)`.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';

const SHORT_DESCRIPTION = 'Seeks to a specific position in the current track.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'seek',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n!seek 10',
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class SeekCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName(this.name)
                    .setDescription(this.description)
                    .addNumberOption((option) =>
                        option
                            .setName('time')
                            .setDescription('The time to seek to (in seconds).')
                            .setMinValue(0)
                            .setRequired(true),
                    ),
            this.slashCommandOptions,
        );
    }

    public async seek(messageOrInteraction: Message | ChatInputCommandInteraction, seconds: number): Promise<void> {
        const guildId = messageOrInteraction.guildId!;
        const player  = this.container.client.musicPlayer.players.get(guildId);
        const embed   = new EmbedBuilder().setColor('Blurple').setTitle('Music');

        if (!player || !this.container.client.musicQueue.has(guildId)) {
            embed.setDescription('🚫 | No track currently playing.');
        } else {
            await player.seekTo(seconds * 1000);
            embed.setDescription(`⏩ | Seeked to \`${seconds}\` seconds.`);
        }

        if (messageOrInteraction instanceof Message) {
            await (messageOrInteraction.channel as TextChannel).send({ embeds: [embed] });
        } else {
            await messageOrInteraction.reply({ embeds: [embed] });
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const time = interaction.options.getNumber('time', true);
        await this.seek(interaction, time);
    }

    public override async messageRun(message: Message, input: Args) {
        const timeStr = input.getOption('time') ?? (await input.pick('number').catch(() => null));
        const time    = typeof timeStr === 'number' ? timeStr : parseFloat(String(timeStr ?? '0'));
        await this.seek(message, time);
    }
}