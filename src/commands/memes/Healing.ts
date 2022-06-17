import { SlashCommandBuilder } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'You really don\'t want to do something.'

@ApplyOptions<PyScriptCommand.Options>({
    name: 'sylphie',
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /sylphie\n' +
        '-- /sylphie <activity>',
    requiredUserPermissions: ["SEND_MESSAGES"],
    requiredClientPermissions: ["SEND_MESSAGES"],
    scriptName: 'sylphie.py',
    nsfw: false,
    options: ['activity']
})
export class SylphieCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry, new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("activity")
                    .setDescription("What activity do you not want to participate in.")
            )
        )
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        const activity = interaction.options.getString('activity');
        await interaction.deferReply()
        const files = await this.run([activity || ""]);
        await interaction.editReply({ files: files });
    }

    public override async messageRun(message: Message, args: Args) {
        const activity = args.getOption('activity') || "";
        const files = await this.run([activity]);
        message.channel.send({ files: files });
    }
}
