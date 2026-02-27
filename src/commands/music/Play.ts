/**
 * @file Play.ts
 * @description `/play` command — enqueues and plays audio via Lavalink/Shoukaku.
 *
 * Accepts a YouTube URL or free-text search query.  If the bot is not already
 * in the invoker's voice channel it joins automatically.  Tracks are pushed onto
 * the per-guild `client.musicQueue`; if nothing is currently playing the first
 * track is started immediately, otherwise it is appended to the queue.
 */
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, Message, TextChannel, VoiceBasedChannel } from 'discord.js';
import type { Track } from 'shoukaku';
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand';
import type { GuildMusicQueue } from '../../lib/structures/managers/GuildMusicQueue';

const SHORT_DESCRIPTION = 'Plays a song from YouTube or a direct URL.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'play',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '!play https://www.youtube.com/watch?v=BOnp3G4h7cg\n' +
        '!play never gonna give you up',
    requiredUserPermissions: ['Connect'],
    requiredClientPermissions: ['Connect', 'Speak', 'RequestToSpeak'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true,
})
export class PlayCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand(
            (builder) =>
                builder
                    .setName(this.name)
                    .setDescription(this.description)
                    .addStringOption((option) =>
                        option
                            .setName('source')
                            .setDescription('A URL to the track or a search query.')
                            .setRequired(true),
                    ),
            this.slashCommandOptions,
        );
    }

    /** Resolves `source` to a list of tracks via the Lavalink REST API. */
    private async resolve(source: string): Promise<Track[]> {
        const shoukaku = this.container.client.musicPlayer;
        const node = shoukaku.getIdealNode();
        if (!node) throw new Error('No Lavalink nodes are available.');

        const identifier = /^https?:\/\//i.test(source) ? source : `ytsearch:${source}`;
        const result = await node.rest.resolve(identifier);

        if (!result || result.loadType === 'empty' || result.loadType === 'error') return [];
        if (result.loadType === 'track') return [result.data];
        if (result.loadType === 'playlist') return result.data.tracks;
        return result.data; // 'search'
    }

    /** Core enqueue logic shared by slash and prefix invocations. */
    public async enqueue(
        messageOrInteraction: Message | ChatInputCommandInteraction,
        source: string,
        voiceChannel: VoiceBasedChannel,
    ): Promise<void> {
        const { client } = this.container;
        const guild = messageOrInteraction.guild!;
        const guildId = guild.id;
        const textChannelId = messageOrInteraction.channelId;

        const tracks = await this.resolve(source);
        if (tracks.length === 0) {
            const content = '❌ No tracks found for that query.';
            if (messageOrInteraction instanceof Message) {
                await (messageOrInteraction.channel as TextChannel).send({ content });
            } else {
                await messageOrInteraction.editReply({ content });
            }
            return;
        }

        let player = client.musicPlayer.players.get(guildId);
        if (!player) {
            player = await client.musicPlayer.joinVoiceChannel({
                guildId,
                channelId: voiceChannel.id,
                deaf: true,
                shardId: guild.shardId,
            });

            player.on('end', async () => {
                const queue = client.musicQueue.get(guildId);
                if (!queue) return;

                if (queue.loop && queue.tracks.length > 0) {
                    await player!.playTrack({ track: queue.tracks[0] });
                    return;
                }

                queue.tracks.shift();

                if (queue.tracks.length === 0) {
                    client.musicPlayer.leaveVoiceChannel(guildId);
                    client.musicQueue.delete(guildId);
                    return;
                }

                await player!.playTrack({ track: queue.tracks[0] });
            });

            player.on('exception', (data) => {
                this.container.logger.error('[Shoukaku Player] Exception:', data);
                client.musicPlayer.leaveVoiceChannel(guildId);
                client.musicQueue.delete(guildId);
            });
        }

        const existingQueue = client.musicQueue.get(guildId);
        const track = tracks[0];

        if (existingQueue) {
            existingQueue.tracks.push(track);
            const reply = new EmbedBuilder()
                .setColor('Blurple')
                .setTitle('Added to Queue')
                .setDescription(`**${(track.info as { title?: string }).title ?? 'Unknown'}**`)
                .setFooter({ text: `Position in queue: ${existingQueue.tracks.length}` });

            if (messageOrInteraction instanceof Message) {
                await (messageOrInteraction.channel as TextChannel).send({ embeds: [reply] });
            } else {
                await messageOrInteraction.editReply({ embeds: [reply] });
            }
        } else {
            const newQueue: GuildMusicQueue = {
                tracks: [track],
                voiceChannelId: voiceChannel.id,
                textChannelId,
                loop: false,
            };
            client.musicQueue.set(guildId, newQueue);
            await player.playTrack({ track });

            const reply = new EmbedBuilder()
                .setColor('Blurple')
                .setTitle('Now Playing 🎶')
                .setDescription(`**${(track.info as { title?: string }).title ?? 'Unknown'}**`);

            if (messageOrInteraction instanceof Message) {
                await (messageOrInteraction.channel as TextChannel).send({ embeds: [reply] });
            } else {
                await messageOrInteraction.editReply({ embeds: [reply] });
            }
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const source = interaction.options.getString('source', true);
        const member = interaction.guild!.members.cache.get(interaction.user.id)!;
        const voiceChannel = member.voice.channel as VoiceBasedChannel;

        if (!voiceChannel) {
            await interaction.reply({ content: '🚫 | You must be in a voice channel to play music.', ephemeral: true });
            return;
        }

        await interaction.deferReply();
        await this.enqueue(interaction, source, voiceChannel);
    }

    public override async messageRun(message: Message, input: Args) {
        const source = input.getOption('source') ?? (await input.rest('string').catch(() => null));
        if (!source) {
            if (message.channel.isSendable()) {
                await message.channel.send({ content: '🚫 | Please provide a search query or URL.' });
            }
            return;
        }

        const member = message.guild!.members.cache.get(message.author.id)!;
        const voiceChannel = member.voice.channel as VoiceBasedChannel;

        if (!voiceChannel) {
            if (message.channel.isSendable()) {
                await message.channel.send({ content: '🚫 | You must be in a voice channel to play music.' });
            }
            return;
        }

        await this.enqueue(message, source, voiceChannel);
    }
}
