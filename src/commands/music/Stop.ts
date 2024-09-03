import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import { EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";

const SHORT_DESCRIPTION = `Stops current playback.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'stop',
    aliases: [],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ["Connect"],
    requiredClientPermissions: ["Connect", "Speak", "RequestToSpeak"],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true
})
export class StopCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
        );
    }

    public async stop(messageOrInteraction: Message | ChatInputCommandInteraction) {
        const player = this.container.client.musicPlayer;
        try {
            await player.stop(messageOrInteraction);
            const embeds = [new EmbedBuilder().setColor("Blurple").setTitle("DisTube").setDescription("Stopped!")];
            if (messageOrInteraction instanceof Message) {
                messageOrInteraction.reply({ embeds });
            } else {
                messageOrInteraction.reply({ embeds });
            }
        } catch (e) {
            console.error(e);
            const embeds = [new EmbedBuilder().setColor("Blurple").setTitle("DisTube").setDescription(`Error: \`${e}\``)];
            if (messageOrInteraction instanceof Message) {
                messageOrInteraction.reply({ embeds });
            } else {
                messageOrInteraction.reply({ embeds });
            }
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        await this.stop(interaction);
    }

    public override async messageRun(message: Message, _input: Args) {
        await this.stop(message);
    }
}