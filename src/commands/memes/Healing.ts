/**
 * @file Healing.ts
 * @description `/sylphie` command — generates a "The one thing I ever want to do" meme.
 *
 * Passes an optional activity string to `sylphie.py`, which composites the text
 * onto the Redo of Healer template image.
 */
import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'The one thing you have always wanted to do.';

@ApplyOptions<PyScriptCommand.Options>({
    name: 'sylphie',
    aliases: ['healing'],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /sylphie\n' +
        '-- /sylphie <activity>',
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    scriptName: 'sylphie.py',
    nsfw: false,
    options: ['activity']
})
export class SylphieCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("activity")
                    .setDescription("What's the one thing you only ever want to do.")
            )
            ,
            this.slashCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const activity = interaction.options.getString('activity');
        await interaction.deferReply()
        const files = await this.run([activity || ""]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        const activity = await args.rest('string').catch(() => '');
        const files = await this.run([activity]);
        if (message.channel.isSendable()) {
            await message.channel.send({ files: files });
        }
    }
}
