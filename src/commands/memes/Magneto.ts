import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'Magneto\'s been thwarted again.'

@ApplyOptions<PyScriptCommand.Options>({
    name: 'magneto',
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /magneto\n' +
        '-- /magneto <image>',
    requiredUserPermissions: ["SEND_MESSAGES"],
    requiredClientPermissions: ["SEND_MESSAGES"],
    scriptName: 'magneto.py',
    nsfw: false,
    options: ['image']
})
export class MagnetoCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("image")
                    .setDescription("Provide the image that is thwarting magneto.")
                    .setRequired(true)
            ),
            this.slashCommandOptions
        )
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        const image = interaction.options.getString('image', true);
        await interaction.deferReply()
        const files = await this.run([image]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        var image = args.getOption('image') ?? message.attachments.first()?.url;
        if(!image) {
            message.channel.send({ content: `No valid image found. Please provide a link or attach an image.`});
            return;
        }
        const files = await this.run([image]);
        message.channel.send({ files: files });
    }
}
