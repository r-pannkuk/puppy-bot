import { ApplyOptions } from '@sapphire/decorators';
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext, ContextMenuCommandContext } from '@sapphire/framework';
import { TextChannel, type ChatInputCommandInteraction, type ContextMenuCommandInteraction, type Message } from 'discord.js';
import { PyScriptCommand } from '../../lib/structures/command/PyScriptCommand';

const SHORT_DESCRIPTION = 'Someone is whining again.'

@ApplyOptions<PyScriptCommand.Options>({
    name: 'kinzo',
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '-- /kinzo --user=@user --text=text\n',
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    scriptName: 'kinzo.py',
    nsfw: false,
    options: ['user', 'text']
})
export class KinzoCommand extends PyScriptCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("Target a usre for whining.")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("text")
                    .setDescription("Enter what you want the user to whine about.")
                    .setRequired(true)
            )
            ,
            this.slashCommandOptions
        )

        registry.registerContextMenuCommand((builder) => builder
            .setName('Meme - Kinzo Whining')
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
        const files = await this.run([member?.displayName || user.username, text]);
        await interaction.editReply({ files: files });
    }

    public override async contextMenuRun(interaction: ContextMenuCommandInteraction, _context: ContextMenuCommandContext) {
        if (interaction.isMessageContextMenuCommand()) {
            const message = interaction.targetMessage;
            const member = interaction.guild?.members.cache.get(message.author.id);
            const text = message.content;
            await interaction.deferReply();
            const files = await this.run([member?.displayName || message.author.username, text]);
            await interaction.editReply({ files: files });
        } else {
            await interaction.deleteReply();
        }
    }

    public override async messageRun(message: Message, args: Args) {
        const member = message.guild?.members.cache.get(args.getOption('user')!);
        const text = args.getOption('text');
        const files = await this.run([member!.displayName!, text!]);
        if(message.channel instanceof TextChannel) {
            message.channel.send({ files: files });
        }
    }
}
