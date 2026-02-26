/**
 * @file Resume.ts
 * @description `/resume` command — resumes a paused track.
 *
 * Delegates to the Shoukaku Player's `setPaused(false)`.
 * Aliases: `unpause`.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Guild, Message, TextChannel } from 'discord.js';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';
import { Emojis } from '../../lib/utils/constants';

const SHORT_DESCRIPTION = 'Resumes a paused track.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'resume',
    aliases: ['unpause'],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class ResumeCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) => builder.setName(this.name).setDescription(this.description),
            this.slashCommandOptions,
        );
    }

    public resume(guild: Guild): string {
        const player = this.container.client.musicPlayer.players.get(guild.id);
        const queue  = this.container.client.musicQueue.get(guild.id);

        if (!player || !queue || queue.tracks.length === 0) {
            return `${Emojis.NoSign} | No track currently paused.`;
        }
        if (!player.paused) {
            return `${Emojis.NoSign} | Playback is not paused.`;
        }

        player.setPaused(false);
        const title = (queue.tracks[0].info as { title?: string }).title ?? 'Unknown';
        return `${Emojis.Resume} | Resumed: **${title}**`;
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await interaction.reply({ content: this.resume(interaction.guild!) });
    }

    public override async messageRun(message: Message, _input: Args) {
        if (message.channel instanceof TextChannel) {
            await message.channel.send({ content: this.resume(message.guild!) });
        }
    }
}