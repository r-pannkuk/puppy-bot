import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import { TextChannel, type ChatInputCommandInteraction, type Guild } from "discord.js";
import type { Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Emojis } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = `Skips the current track and gets the next one.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'skip',
    aliases: ['next'],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ["Connect"],
    requiredClientPermissions: ["Connect", "Speak", "RequestToSpeak"],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: true
})
export class SkipCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description),
            this.slashCommandOptions
        )
    }

    public skip(guild: Guild) {
        const queue = this.container.client.musicPlayer.getQueue(guild.id);

        if (!queue) {
            return null;
        }

        if (queue.songs.length > 1 || queue.autoplay) {
            queue.skip();
        } else {
            queue.stop();
        }

        return queue;
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const queue = this.skip(interaction.guild!);
        var song = queue?.songs[1];

        await interaction.reply({
            content: (!queue) ?
                `${Emojis.NoSign} | There is no music currently playing.` :
                `${Emojis.Skip} | Skipping Track...${song ? `` : `End of queue.`}`
        });
    }

    public override async messageRun(message: Message, _input: Args) {
        const queue = this.skip(message.guild!);
        var song = queue?.songs[1];
        if(message.channel instanceof TextChannel) {

            await message.channel.send({
                content: (!queue) ?
                    `${Emojis.NoSign} | There is no music currently playing.` :
                    `${Emojis.Skip} | Skipping Track...${song ? `` : `End of queue.`}`
            });
        }
    }
}