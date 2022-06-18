import { SlashCommandBuilder } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from "@sapphire/framework";
import type { Guild } from "discord.js";
import type { CommandInteraction, Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Emojis } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = `Skips the current track and gets the next one.`

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'skip',
    aliases: ['next'],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ["CONNECT"],
    requiredClientPermissions: ["CONNECT", "SPEAK", "REQUEST_TO_SPEAK"],
    nsfw: false,
    runIn: 'GUILD_ANY',
    options: true
})
export class SkipCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry, new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
)
    }

	public skip(guild : Guild) {
		const queue = this.container.client.musicPlayer.getQueue(guild.id);

		if(!queue) {
			return null;
		}

        if(queue.songs.length > 1 || queue.autoplay) {
            queue.skip();
        } else {
            queue.stop();
        }

		return queue;
	}

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
		const queue = this.skip(interaction.guild!);

        await interaction.reply({
            content: (!queue) ?
                `${Emojis.NoSign} | There is no music currently playing.` :
                `${Emojis.Skip} | Skipping Track...`
        });
    }

    public override async messageRun(message: Message, _input: Args) {
        const queue = this.skip(message.guild!);

		await message.channel.send({
			content: (!queue) ?
                `${Emojis.NoSign} | There is no music currently playing.` :
                `${Emojis.Skip} | Skipping Track...`
        });
    }
}