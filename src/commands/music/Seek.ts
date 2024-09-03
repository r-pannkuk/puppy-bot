import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import type { ChatInputCommandInteraction, Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";

const SHORT_DESCRIPTION = `Seeks to a specific time in the song (in seconds).`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'seek',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '!seek 10',
    requiredUserPermissions: ["Connect"],
    requiredClientPermissions: ["Connect", "Speak", "RequestToSpeak"],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true
})
export class SeekCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addNumberOption((option) =>
                option
                    .setName("time")
                    .setDescription("The time to seek (in seconds).")
                    .setMinValue(0)
                    .setRequired(true)
            ),
            this.slashCommandOptions
        )
    }

    public async seek(messageOrInteraction: Message | ChatInputCommandInteraction, time: number) {
        const player = this.container.client.musicPlayer;

        player.seek(messageOrInteraction.guildId!, time);
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const time = interaction.options.getNumber("time", true);

        await this.seek(interaction, time);

        await interaction.reply({
            embeds: [
                new EmbedBuilder().setColor("Blurple").setTitle("DisTube").setDescription(`Seeked to \`${time}\` seconds`),
            ],
        });
    }

    public override async messageRun(message: Message, input: Args) {
        var time = parseFloat(input.getOption('time') ?? input.next() as string);

        await this.seek(message, time);

        await message.reply({
            embeds: [
                new EmbedBuilder().setColor("Blurple").setTitle("DisTube").setDescription(`Seeked to \`${time}\` seconds`),
            ],
        });
    }
}