/**
 * @file Skip.ts
 * @description `/skip` command — skips the current track in the queue.
 *
 * Calls `player.stopTrack()` on the Shoukaku Player, which fires the `end`
 * event and automatically advances to the next queued track.  Aliases: `next`.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Guild, Message, TextChannel } from 'discord.js';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';
import { Emojis } from '../../lib/utils/constants';

const SHORT_DESCRIPTION = 'Skips the current track.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'skip',
    aliases: ['next'],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class SkipCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) => builder.setName(this.name).setDescription(this.description),
            this.slashCommandOptions,
        );
    }

    public async skip(guild: Guild): Promise<string> {
        const player = this.container.client.musicPlayer.players.get(guild.id);
        const queue  = this.container.client.musicQueue.get(guild.id);

        if (!player || !queue || queue.tracks.length === 0) {
            return `${Emojis.NoSign} | There is no music currently playing.`;
        }

        const next = queue.tracks[1];
        await player.stopTrack();

        return next
            ? `${Emojis.Skip} | Skipping. Next up: **${(next.info as { title?: string }).title ?? 'Unknown'}**`
            : `${Emojis.Skip} | Skipping. End of queue.`;
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await interaction.reply({ content: await this.skip(interaction.guild!) });
    }

    public override async messageRun(message: Message, _input: Args) {
        if (message.channel instanceof TextChannel) {
            await message.channel.send({ content: await this.skip(message.guild!) });
        }
    }
}