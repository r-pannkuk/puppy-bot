import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry, ChatInputCommandContext } from "@sapphire/framework";
import { ChannelType, ChatInputCommandInteraction, Guild, GuildTextBasedChannel, Message, Role, User } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { isNullish, isNullishOrEmpty } from "@sapphire/utilities"
import { PuppyBotEmbed } from "../../lib/structures/message/PuppyBotEmbed";

const SHORT_DESCRIPTION = 'Sets a designated guild role or channel.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'set',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        '`!set delete channel #channel`\n' +
        '`!set role-assign channel #channel`\n' +
        '`!set moderate role @role`\n',
    requiredUserPermissions: ["ManageChannels", "ManageRoles"],
    requiredClientPermissions: ["SendMessages", "ManageChannels", "ManageRoles"],
    nsfw: false,
    runIn: 'GUILD_ANY',
    options: true
})
export class AddCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand((builder) =>
                builder
                    .setName("logging")
                    .setDescription("Message edit and deletion logs.")
                    .addChannelOption((option) =>
                        option
                            .setName("channel")
                            .setDescription("What channel should store message audit logs?")
                            .addChannelTypes(ChannelType.GuildText)
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName('log-deletions')
                            .setDescription("Should the message audit logger be logging deletions? Defaults to true.")
                    )
                    .addBooleanOption((option) =>
                        option
                            .setName('log-edits')
                            .setDescription("Should the message audit logger be logging edits? Defaults to false.")
                    )
            )
            .addSubcommand((builder) =>
                builder
                    .setName("moderate")
                    .setDescription("User moderation and time outs.")
                    .addChannelOption((option) =>
                        option
                            .setName("channel")
                            .setDescription("What channel should moderated users be limited to?")
                            .addChannelTypes(ChannelType.GuildText)
                    )
                    .addRoleOption((option) =>
                        option
                            .setName("role")
                            .setDescription("What role should moderate users?")
                    )
            )
            .addSubcommand((builder) =>
                builder
                    .setName("role-assign")
                    .setDescription("Group role assignment and channel creation.")
                    .addChannelOption((option) =>
                        option
                            .setName("channel")
                            .setDescription("What channel should role assignment messages be sent to?")
                            .setRequired(true)
                            .addChannelTypes(ChannelType.GuildText)
                    )
            )
            .addSubcommand((builder) =>
                builder
                    .setName("trap")
                    .setDescription("Trap announcement messaging.")
                    .addChannelOption((option) =>
                        option
                            .setName("channel")
                            .setDescription("What channel should trap messages be sent to?")
                            .setRequired(true)
                            .addChannelTypes(ChannelType.GuildText)
                    )
            )
            ,
            this.slashCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        var subCommand = interaction.options.getSubcommand(true) as SetCommand.ValidSubCommand;
        // var targetRole = interaction.options.getRole('role') as Role
        var channel = interaction.options.getChannel('channel') as GuildTextBasedChannel;
        const logDeletions = interaction.options.getBoolean('log-deletions');
        const logEdits = interaction.options.getBoolean('log-edits');
        const role = interaction.options.getRole('role') as Role;

        if(!(subCommand as SetCommand.ValidSubCommand)) this.error(`SubCommand not found.`, subCommand);

        this.run({
            messageOrInteraction: interaction,
            guild: interaction.guild!,
            user: interaction.user,
            subCommand,
            options: {
                "log-deletions": logDeletions,
                "log-edits": logEdits,
                channel,
                role,
            }
        })
    }

    public async run<S extends SetCommand.ValidSubCommand>(args: {
        messageOrInteraction: Message | ChatInputCommandInteraction,
        subCommand: S,
        guild: Guild,
        user: User,
        options: SetCommand.CommandOptions<S>
    }) {
        const { subCommand, messageOrInteraction, guild, user, options } = args;

        if (subCommand === 'logging') {
            await this.handleLogging(messageOrInteraction, guild, user, options as SetCommand.CommandOptions<'logging'>);
        } else if (subCommand === 'moderate') {
            await this.handleModerate(messageOrInteraction, guild, user, options as SetCommand.CommandOptions<'moderate'>);

            // const oldChannel = interaction.guild!.settings.moderationChannel;
            // const oldRole = await interaction.guild!.settings.moderationRole;
            // await this.handleModerate(interaction.guild!, targetChannel, targetRole)
            // await interaction.reply({
            //     content: `Updated moderation settings:\n` +
            //         `\tChannel: ${oldChannel} ${(oldChannel?.id === targetChannel.id) ? "" : `--> ${targetChannel}`}\n` +
            //         `\tRole: ${oldRole} ${(oldRole?.id === targetRole.id) ? "" : `--> ${targetRole}`}`
            // })
        } else if (subCommand === 'role-assign') {
            await this.handleRoleAssign(messageOrInteraction, guild, user, options as SetCommand.CommandOptions<'role-assign'>);
        } else if (subCommand === 'trap') {
            await this.handleTrap(messageOrInteraction, guild, user, options as SetCommand.CommandOptions<'trap'>);
        }
    }

    public async handleLogging(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: SetCommand.CommandOptions<'logging'>) {
        const followUp = await this.generateFollowUp(messageOrInteraction);

        const oldConfig = guild.messageEchoer.config;
        const oldChannel = guild.channels.cache.get(oldConfig?.outputChannelId ?? ``);

        await guild.messageEchoer.setConfig({
            outputChannelId: options.channel?.id ?? undefined,
            echoDeletes: options["log-deletions"] ?? undefined,
            echoEdits: options["log-edits"] ?? undefined,
        });

        var embed = new PuppyBotEmbed()
            .setTitle(`Message Audit Logger Settings`)
            .splitFields({
                content: [
                    `**Channel**: ${oldChannel}${options.channel && oldChannel?.id !== options.channel?.id ? ` --> ${options.channel}` : ``}`,
                    `**Echo Deletes**: \`${oldConfig?.echoDeletes}\`${(!isNullish(options["log-deletions"]) && (oldConfig?.echoDeletes !== options["log-deletions"])) ? ` --> \`${options["log-deletions"]}\`` : ``}`,
                    `**Echo Edits**: \`${oldConfig?.echoEdits}\`${(!isNullish(options["log-edits"]) && (oldConfig?.echoDeletes !== options["log-edits"])) ? ` --> \`${options["log-edits"]}\`` : ``}`
                ],
            });

        await followUp({
            embeds: [embed]
        })

    }

    public async handleModerate(_messageOrInteraction: Message | ChatInputCommandInteraction, _guild: Guild, _user: User, options: SetCommand.CommandOptions<'moderate'>) {
        const { channel, role } = options;
        if (isNullishOrEmpty(channel) && isNullishOrEmpty(role)) {
            this.error("Moderation Settings", "Either channel or role must be provided to update settings.");
        }

        this.error(`Not implemented yet.`);

        // if (channel) {
        //     guild.settings.moderationChannelId = channel.id
        // }

        // if (role) {
        //     guild.settings.roleChannelId = role.id
        // }
    }

    public async handleRoleAssign(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: SetCommand.CommandOptions<'role-assign'>) {
        const followUp = await this.generateFollowUp(messageOrInteraction);
        const oldChannel = guild.channels.cache.get(guild.roleAssigner.config?.roleChannelId ?? 'null');

        if (options.channel) {
            await guild.roleAssigner.setConfig({
                roleChannelId: options.channel.id,
            });
            await guild.roleAssigner.generateMessageCollectors();
        }

        var embed = new PuppyBotEmbed()
            .setTitle(`Role Assigner Settings`)
            .splitFields({
                content: [
                    `**Channel**: ${oldChannel}${options.channel && oldChannel?.id !== options.channel?.id ? ` --> ${options.channel}` : ``}`,
                ],
            });

        await followUp({
            embeds: [embed]
        })
    }

    public async handleTrap(messageOrInteraction: Message | ChatInputCommandInteraction, guild: Guild, _user: User, options: SetCommand.CommandOptions<'trap'>) {
        const followUp = await this.generateFollowUp(messageOrInteraction);
        var config = guild.battleSystem.config;
        const oldChannel = guild.channels.cache.get(config?.trapConfig.trapChannelId ?? 'null');

        if (options.channel) {
            config.trapConfig.trapChannelId = options.channel.id;
            await guild.battleSystem.setConfig(config);
        }

        var embed = new PuppyBotEmbed()
            .setTitle(`Battle System - Trap Settings`)
            .splitFields({
                content: [
                    `**Channel**: ${oldChannel}${options.channel && oldChannel?.id !== options.channel?.id ? ` --> ${options.channel}` : ``}`,
                ],
            });

        await followUp({
            embeds: [embed]
        })
    }
}

export namespace SetCommand {
    export interface CommandStructure extends PuppyBotCommand.CommandStructure {
        'logging': {
            'channel'?: GuildTextBasedChannel | null,
            'log-deletions'?: boolean | null,
            'log-edits'?: boolean | null,
        },
        'moderate': {
            'channel'?: GuildTextBasedChannel | null,
            'role'?: Role | null,
        },
        'role-assign': {
            'channel': GuildTextBasedChannel
        },
        'trap': {
            'channel': GuildTextBasedChannel
        }
    }

    export type ValidSubCommand = PuppyBotCommand.ValidSubCommand<CommandStructure>
    export type ValidOption<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.ValidOption<CommandStructure, undefined, S>
    export type ValidOptionType<S extends ValidSubCommand | undefined = undefined, O extends ValidOption<S> | undefined = undefined> = PuppyBotCommand.ValidOptionType<CommandStructure, undefined, S, O>

    export type ValidHandler = ValidSubCommand;
    // export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
    export type CommandOptions<S extends ValidSubCommand | undefined = undefined> = PuppyBotCommand.CommandOptions<CommandStructure, undefined, S>;
}