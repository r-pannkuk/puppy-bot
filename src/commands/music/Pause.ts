/**
 * @file Pause.ts
 * @description `/pause` command — pauses the currently playing track.
 *
 * Delegates to the Shoukaku Player's `setPaused(true)` method.  Responds with
 * an error if nothing is playing or the queue is already paused.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, Guild, Message } from 'discord.js';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';
import { Emojis } from '../../lib/utils/constants';

const SHORT_DESCRIPTION = 'Pauses the currently playing track.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'pause',
    aliases: [],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class PauseCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) => builder.setName(this.name).setDescription(this.description),
            this.slashCommandOptions,
        );
    }

    public pause(guild: Guild): string {
        const player = this.container.client.musicPlayer.players.get(guild.id);
        const queue  = this.container.client.musicQueue.get(guild.id);

        if (!player || !queue || queue.tracks.length === 0) {
            return `${Emojis.NoSign} | No track currently playing.`;
        }
        if (player.paused) {
            return `${Emojis.NoSign} | Playback is already paused.`;
        }

        player.setPaused(true);
        const title = (queue.tracks[0].info as { title?: string }).title ?? 'Unknown';
        return `${Emojis.Pause} | Paused: **${title}**`;
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await interaction.reply({ content: this.pause(interaction.guild!) });
    }

    public override async messageRun(message: Message, _input: Args) {
        if (message.channel.isSendable()) {
            await message.channel.send({ content: this.pause(message.guild!) });
        }
    }
}