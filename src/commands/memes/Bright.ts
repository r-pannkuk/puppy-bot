/**
 * @file Bright.ts
 * @description `/correct` command — generates a "Bright slap" meme.
 *
 * Passes the target user's avatar URL to `bright.py`, which composites the
 * avatar onto the slap-meme template using Pillow and returns the output image
 * path.  The image is then sent as a Discord attachment.
 *
 * Aliases: `bright`, `punch`.
 */
import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import { TextChannel } from 'discord.js';
import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'Slaps a user with a Bright meme.';

@ApplyOptions<PyScriptCommand.Options>({
    name: 'correct',
    aliases: ['bright', 'punch'],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- !correct @Dog\n' +
        '-- !bright @Dog',
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    scriptName: 'bright.py',
    nsfw: false,
    options: ['target']
})
export class BrightCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .addUserOption((option) =>
                option
                    .setName("target")
                    .setDescription("Choose which user to correct.")
                    .setRequired(true)
            )
            .setDescription(this.description)
            ,
            this.slashCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const target = interaction.options.getUser('target', true);
        await interaction.deferReply()
        const files = await this.run([target.displayAvatarURL()]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        const target = await args.pick('member').catch(() => null);
        if (!target) {
            await message.reply('Please mention a valid server member.');
            return;
        }
        const files = await this.run([target.displayAvatarURL()]);
        if(message.channel instanceof TextChannel) {
            message.channel.send({ files: files });
        }
    }
}
