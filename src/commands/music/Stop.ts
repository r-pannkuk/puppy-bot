import { ApplyOptions } from "@sapphire/decorators";
import { CommandOptionsRunTypeEnum, type ApplicationCommandRegistry, type Args, type ChatInputCommandContext } from "@sapphire/framework";
import type { ChatInputCommandInteraction, Guild } from "discord.js";
import type { Message } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Emojis } from "../../lib/utils/constants";

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

	public stop(guild : Guild) {
		const queue = this.container.client.musicPlayer.getQueue(guild.id);

		if(!queue) {
			return null;
		}

		queue.stop();

		return queue;
	}

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
		const queue = this.stop(interaction.guild!);

        await interaction.reply({
            content: (!queue) ?
                `${Emojis.NoSign} | There is no music currently playing.` :
                `${Emojis.StopSign} | Stopping Playback...`
        });
    }

    public override async messageRun(message: Message, _input: Args) {
        const queue = this.stop(message.guild!);

		await message.channel.send({
			content: (!queue) ?
                `${Emojis.NoSign} | There is no music currently playing.` :
                `${Emojis.StopSign} | Stopping Playback...`
        });
    }
}