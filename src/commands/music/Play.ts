import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from "@sapphire/framework";
import type { GuildMember, GuildTextBasedChannel, VoiceBasedChannel } from "discord.js";
import type { CommandInteraction, Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Emojis } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = `Plays music from the specified YouTube, Spotify, or Apple links.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'play',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '!play https://www.youtube.com/watch?v=BOnp3G4h7cg',
    requiredUserPermissions: ["CONNECT"],
    requiredClientPermissions: ["CONNECT", "SPEAK", "REQUEST_TO_SPEAK"],
    nsfw: false,
    runIn: 'GUILD_ANY',
    options: true
})
export class PlayCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry, new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("source")
                    .setDescription("Name of the track or playlist to play.")
                    .setRequired(true)
            )
        )
    }

    public async enqueue(searcher: GuildMember, query: string, responseChannel?: GuildTextBasedChannel | undefined, voiceChannel?: VoiceBasedChannel | undefined) {
        const player = this.container.client.musicPlayer;

        if (!voiceChannel) {
            voiceChannel = searcher.guild.channels.cache.filter(c => c.isVoice()).first() as VoiceBasedChannel;

            if (!voiceChannel) {
                this.error("There are no voice channels for me to play music from!");
            }
        }

        await player.play(voiceChannel, query, {
            textChannel: responseChannel,
            member: searcher,
            metadata: {
                interval: undefined
            }
        })

        return player.getQueue(searcher.guild.id);
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        var source = interaction.options.getString('source', true);
        const member = interaction.member as GuildMember;

        await interaction.deferReply();

        var queue = await this.enqueue(member, source, interaction.channel as GuildTextBasedChannel, member.voice.channel as VoiceBasedChannel);
        var song = queue?.songs[queue.songs.length - 1];

        await interaction.editReply({
            content: (!song) ?
                `${Emojis.NoSign} | Could not find: **${source}**` :
                `${Emojis.Loading} | Added **${song.name}** to the queue`
        });
    }

    public override async messageRun(message: Message, input: Args) {
        var source = input.getOption('source') as string;
        const member = message.author as unknown as GuildMember;

        var queue = await this.enqueue(member, source, message.channel as GuildTextBasedChannel, member.voice.channel as VoiceBasedChannel);
        var song = queue?.songs[0];

        await message.channel.send({
            content: (!song) ?
                `${Emojis.NoSign} | Could not find: **${source}**` :
                `${Emojis.Loading} | Added **${song.name}** to the queue`
        });
    }
}