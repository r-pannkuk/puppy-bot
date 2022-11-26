import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'Correct a user with a well-placed intention to their face.'

@ApplyOptions<PyScriptCommand.Options>({
    name: 'correct',
    aliases: ['bright', 'punch'],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- !correct @Dog\n' +
        '-- !bright @Dog',
    requiredUserPermissions: ["SEND_MESSAGES"],
    requiredClientPermissions: ["SEND_MESSAGES"],
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

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        const target = interaction.options.getUser('target', true);
        await interaction.deferReply()
        const files = await this.run([target.displayAvatarURL()]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        const target = message.guild!.members.cache.get(args.getOption('target') as string);
        const files = await this.run([target!.displayAvatarURL()]);
        message.channel.send({ files: files });
    }
}
