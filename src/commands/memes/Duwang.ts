import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import { TextChannel, type ChatInputCommandInteraction, type Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'Exclaim your wonder for the beautiful day.'

@ApplyOptions<PyScriptCommand.Options>({
    name: 'duwang',
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /duwang\n' +
        '-- /duwang <image>',
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    scriptName: 'duwang.py',
    nsfw: false,
    options: ['target']
})
export class DuwangCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("target")
                    .setDescription("Enter an image URL or the text to say.")
            ),
            this.slashCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const target = interaction.options.getString('target');
        await interaction.deferReply()
        const files = await this.run([target ?? ""]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        var target = args.getOption('target') ?? message.attachments.first()?.url;
        const files = await this.run(target ? [target] : []);
        if(message.channel instanceof TextChannel) {
            message.channel.send({ files: files });
        }
    }
}
