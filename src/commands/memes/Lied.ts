/**
 * @file Lied.ts
 * @description `/lied` command — generates a "Liar" meme stamped with a user's avatar.
 *
 * Passes the target user's avatar URL and a custom text string to `lied.py`,
 * which composites them onto the Elfen Lied template.
 *
 * Also registered as the `Meme - Liar` message context-menu command, which
 * uses the right-clicked message content as the "lie" text.
 */
import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext, ContextMenuCommandContext } from '@sapphire/framework';
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'You cannot lie to me!';

@ApplyOptions<PyScriptCommand.Options>({
    name: 'lied',
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /lied --user=@user --text=text\n',
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    scriptName: 'lied.py',
    nsfw: false,
    options: ['user', 'text']
})
export class LiedCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("Target a user for telling the truth.")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("text")
                    .setDescription("Enter what you want the user to say.")
                    .setRequired(true)
            )
            ,
            this.slashCommandOptions
        )

        registry.registerContextMenuCommand((builder) => builder
            .setName('Meme - Liar')
            .setType(3 /* ContextMenuCommandType.MESSAGE */)
            ,
            this.contextCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const user = interaction.options.getUser('user', true)
        const member = interaction.guild?.members.cache.get(interaction.options.getUser('user', true)?.id);
        const text = interaction.options.getString('text', true);
        await interaction.deferReply()
        const files = await this.run([member!.displayAvatarURL() || user.displayAvatarURL() || member!.avatar || user.avatar || "", member!.displayName! || user.username, text!]);
        await interaction.editReply({ files: files });
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction, _context: ContextMenuCommandContext) {
        if (interaction.isMessageContextMenuCommand()) {
            const message = interaction.targetMessage;
            const text = message.content;
            await interaction.deferReply();
            const files = await this.run([message.author.displayAvatarURL() || "", message.author.displayName, text!]);
            await interaction.editReply({ files: files });
        } else {
            await interaction.deleteReply();
        }
    }

    public override async messageRun(message: Message, args: Args) {
        const member = await args.pick('member').catch(() => null);
        if (!member) {
            await message.reply('Please mention a valid server member: `!lied @user <text>`.');
            return;
        }
        const text = await args.rest('string').catch(() => null);
        if (!text) {
            await message.reply('Please provide lie text: `!lied @user <text>`.');
            return;
        }
        const files = await this.run([member.displayAvatarURL() || member.avatar || '', member.displayName, text]);
        if (message.channel.isSendable()) {
            await message.channel.send({ files: files });
        }
    }
}
