import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, Args, ChatInputCommandContext, container } from "@sapphire/framework";
import { CategoryChannel, CommandInteraction, Constants, Guild, GuildMember, GuildTextBasedChannel, Message, Role, User } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { SlashCommandBuilder } from "@discordjs/builders";
import type { OverwriteData } from "discord.js";
import { Emojis } from "../../lib/utils/constants";

const SHORT_DESCRIPTION = 'Creates a new group and role for discussion.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'add',
    aliases: [
        'create'
    ],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        `\`!add group #channel\`\n` +
        `\`!add group #CATEGORY/channel\`\n` +
        `\`!add group #channel @role_name\`\n`,
    requiredUserPermissions: ["MANAGE_CHANNELS", "MANAGE_ROLES"],
    requiredClientPermissions: ['SEND_MESSAGES', "MANAGE_CHANNELS", "MANAGE_ROLES"],
    nsfw: false,
    runIn: 'GUILD_ANY',
    options: true,
    subCommands: [
        {
            input: 'group-channel',
            output: 'messageRunGroup',
            type: 'method',
            default: true
        }
    ]
})
export class AddCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        return this.registerSlashCommand(registry, new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand((builder) =>
                builder
                    .setName("group-channel")
                    .setDescription("Adds a group channel for role assignment.")
                    .addStringOption((option) =>
                        option
                            .setName("channel-name")
                            .setDescription("Name of the channel to create or use.")
                            .setRequired(true)
                    )
                    .addChannelOption((option) =>
                        option
                            .setName("category")
                            .addChannelType(Constants.ChannelTypes.GUILD_CATEGORY.valueOf())
                            .setDescription("The category to place this channel into.")
                    )
                    .addStringOption((option) =>
                        option
                            .setName("role-name")
                            .setDescription("Name of the role to create or use.")
                    )
            )
        )
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        var subcommand = interaction.options.getSubcommand(true);

        if (subcommand === 'group-channel') {
            var category = interaction.options.getChannel("category") as CategoryChannel;
            var channelName = interaction.options.getString("channel-name", true);
            var roleName = interaction.options.getString("role-name") ?? channelName;

            await this.run({
                guild: interaction.guild!,
                messageOrInteraction: interaction,
                options: {
                    "channel-name": channelName,
                    "role-name": roleName,
                    category: category
                },
                subCommand: 'group-channel',
                user: interaction.user,
            });
        }
    }

    public async messageRunGroup(message: Message, args: Args) {
        var mention: string | User | GuildMember | Role | null | undefined = args.getOption('mention');
        if (mention) {
            mention = message.guild?.members.cache.get(mention) ??
                message.guild?.roles.cache.get(mention) ??
                container.client.users.cache.get(mention);
        }
        const options = {
            "channel-name": args.getOption('channel-name'),
            "role-name": args.getOption('role-name'),
            category: message.guild!.channels.cache.get(args.getOption('category')!),
        } as AddCommand.CommandOptions<'group-channel'>;

        await this.run({
            messageOrInteraction: message,
            subCommand: 'group-channel',
            user: message.author,
            guild: message.guild!,
            options,
        })
    }

    public async run<S extends AddCommand.ValidSubCommand>(args: {
        messageOrInteraction: Message | CommandInteraction,
        subCommand: S,
        guild: Guild,
        user: User,
        options: AddCommand.CommandOptions<S>
    }) {
        if (args.subCommand === 'group-channel') {
            args.options['']
            await this.handleGroup(args.messageOrInteraction, args.guild, args.user, args.options as unknown as AddCommand.CommandOptions<'group-channel'>)
        } else {
            this.error(`Invalid sub-command used.`, args.subCommand);
        }
    }

    public async handleGroup(messageOrInteraction: Message | CommandInteraction, guild: Guild, _user: User, options: AddCommand.CommandOptions<'group-channel'>) {
        const followUp = await this.generateFollowUp(messageOrInteraction);
        const role = await guild.settings.createRole(options["role-name"]);

        if (!role) this.error(`Could not create role.`, options['role-name']);

        var overwrites: OverwriteData[] = [{
            id: guild.roles.everyone,
            deny: [
                'SEND_MESSAGES',
                'VIEW_CHANNEL',
                'ADD_REACTIONS',
                'SEND_TTS_MESSAGES',
                'EMBED_LINKS',
                'ATTACH_FILES',
                'READ_MESSAGE_HISTORY',
                'USE_EXTERNAL_EMOJIS'
            ]
        },
        {
            id: role!,
            allow: [
                'SEND_MESSAGES',
                'VIEW_CHANNEL',
                'ADD_REACTIONS',
                'SEND_TTS_MESSAGES',
                'EMBED_LINKS',
                'ATTACH_FILES',
                'READ_MESSAGE_HISTORY',
                'USE_EXTERNAL_EMOJIS'
            ]
        }]

        const categoryName = options['category']?.name ?? (messageOrInteraction.channel as GuildTextBasedChannel).name;

        var channel = await guild.settings.createChannel(options['channel-name'], categoryName, overwrites);

        if (guild.roleAssigner.roleAssignmentChannel) {
            const msg = await guild.roleAssigner.roleAssignmentChannel?.send({
                content: `${role} - React with ${Emojis.GreenTick} to be added to the group and access ${channel}`,
            })
            await msg.react(Emojis.GreenTick);
            guild.roleAssigner.collectOnMessage(msg, role);
        }

        await followUp({ content: `New group channel created:\n\tChannel: ${channel}\n\tRole: ${role}` });
    }
}

export namespace AddCommand {
    export interface CommandStructure extends PuppyBotCommand.CommandStructure {
        'group-channel': {
            'channel-name': string,
            'category': CategoryChannel | undefined
            'role-name': string,
        }
    }

    export type ValidSubCommand = PuppyBotCommand.ValidSubCommand<CommandStructure>
    export type ValidOption<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.ValidOption<CommandStructure, undefined, S>
    export type ValidOptionType<S extends ValidSubCommand | undefined = undefined, O extends ValidOption<S> | undefined = undefined> = PuppyBotCommand.ValidOptionType<CommandStructure, undefined, S, O>

    export type ValidHandler = ValidSubCommand;
    // export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
    export type CommandOptions<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.CommandOptions<CommandStructure, undefined, S>;
}