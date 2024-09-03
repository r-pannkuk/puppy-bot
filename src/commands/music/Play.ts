import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import { ChannelType, EmbedBuilder, TextChannel, type VoiceBasedChannel } from "discord.js";
import { ChatInputCommandInteraction, Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { debugLog } from "../../lib/utils/logging";

const SHORT_DESCRIPTION = `Plays music from the specified YouTube, Spotify, or Apple links.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'play',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '!play https://www.youtube.com/watch?v=BOnp3G4h7cg',
    requiredUserPermissions: ["Connect"],
    requiredClientPermissions: ["Connect", "Speak", "RequestToSpeak"],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true
})
export class PlayCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("source")
                    .setDescription("A URL to the track or the search query.")
                    .setRequired(true)
            ),
            this.slashCommandOptions
        )
    }

    public async enqueue(messageOrInteraction: Message | ChatInputCommandInteraction, input: string, voiceChannel: VoiceBasedChannel) {
        const player = this.container.client.musicPlayer;

        if (!voiceChannel) {
            voiceChannel = messageOrInteraction.guild!.channels.cache.filter(c => c.type === ChannelType.GuildVoice).first() as VoiceBasedChannel;

            if (!voiceChannel) {
                this.error("There are no voice channels for me to play music from!");
            }
        }

        player.play(voiceChannel, input, {
            metadata: { messageOrInteraction },
        })
            .catch(e => {
                debugLog('error', e);
                var embeds = [
                    new EmbedBuilder().setColor("Blurple").setTitle("DisTube").setDescription(`Error: \`${e.message}\``),
                ]
                if (messageOrInteraction.channel instanceof TextChannel) {
                    if (messageOrInteraction instanceof Message) {
                        messageOrInteraction.channel.send({
                            embeds,
                        });
                    } else {
                        messageOrInteraction.editReply({
                            embeds,
                        });
                    }
                }
            });
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const source = interaction.options.getString('source', true);
        const member = interaction.guild!.members.cache.get(interaction.user.id)!;

        await interaction.deferReply();

        await this.enqueue(interaction, source, (member.voice.channel) as VoiceBasedChannel);
    }

    public override async messageRun(message: Message, input: Args) {
        const source = input.getOption('source') ?? input.next() as string;
        const member = message.guild!.members.cache.get(message.author.id)!;

        await this.enqueue(message, source, (member.voice.channel) as VoiceBasedChannel);
    }
}