import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import { TextChannel, type ChatInputCommandInteraction, type Guild } from "discord.js";
import type { Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Emojis } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = `Resume music that has been paused.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'resume',
    aliases: ['unpause'],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ["Connect"],
    requiredClientPermissions: ["Connect", "Speak", "RequestToSpeak"],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true
})
export class ResumeCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description),
            this.slashCommandOptions
        )
    }

    public resume(guild: Guild) {
        const queue = this.container.client.musicPlayer.getQueue(guild.id);

        if (!queue || !queue.paused) {
            return null;
        }

        queue.resume();

        return queue;
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const queue = this.resume(interaction.guild!);

        await interaction.reply({
            content: (!queue) ?
                `${Emojis.NoSign} | No track currently paused.` :
                `${Emojis.Resume} | Resumed track: ${queue.songs[0].name}`
        });
    }

    public override async messageRun(message: Message, _input: Args) {
        const queue = this.resume(message.guild!);
        if(message.channel instanceof TextChannel) {

            await message.channel.send({
                content: (!queue) ?
                    `${Emojis.NoSign} | No track currently paused.` :
                    `${Emojis.Resume} | Resumed track: ${queue.songs[0].name}`
            });
        }
    }
}