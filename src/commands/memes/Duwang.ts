/**
 * @file Duwang.ts
 * @description `/duwang` command — generates the JoJo's Bizarre Adventure "What a beautiful Duwang" meme.
 *
 * Passes an optional image URL or text string to `duwang.py`, which overlays the
 * content onto the manga panel template.  When no target is provided, the script
 * uses a default image.
 */
import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'What a beautiful Duwang!';

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
        const target = await args.pick('string').catch(() => null) ?? message.attachments.first()?.url;
        const files = await this.run(target ? [target] : []);
        if (message.channel.isSendable()) {
            await message.channel.send({ files: files });
        }
    }
}
