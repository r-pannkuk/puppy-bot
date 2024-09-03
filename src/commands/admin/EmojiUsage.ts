import { ApplyOptions } from "@sapphire/decorators";
import { ApplicationCommandRegistry, ChatInputCommandContext, Command, CommandOptionsRunTypeEnum, container, ContextMenuCommandContext } from "@sapphire/framework";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Collection, CommandInteraction, Guild, GuildEmoji, GuildTextBasedChannel, Message, MessagePayload, InteractionEditReplyOptions, User, MessageReplyOptions, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { EmojiUsagePaginatedMessage } from "../../lib/structures/message/admin/EmojiUsagePaginatedMessage";
import { Stopwatch } from '@sapphire/stopwatch';
import { GuildMessageScanner } from "../../lib/structures/managers/GuildMessageScanner";
import { Time } from "@sapphire/time-utilities";
import { PuppyBotEmbed } from "../../lib/structures/message/PuppyBotEmbed";

const SHORT_DESCRIPTION = `Provides statistics about emoji utilization in the server.`;
const REGEX_CUSTOM_EMOJI = /<a:.+?:\d+>|<:.+?:\d+>/g
const WAIT_DURATION_FOR_FOLLOWUP = 600000;

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'emojiusage',
    aliases: [
        'emoji-usage',
        'emoji-count',
        'emoji-stats',
    ],
    description: SHORT_DESCRIPTION,
    requiredUserPermissions: ['Administrator'],
    requiredClientPermissions: ['ViewChannel'],
    nsfw: false,
    runIn: [CommandOptionsRunTypeEnum.GuildAny],
    options: ['emoji', 'member', 'count-reactions'],
    cooldownLimit: 1,
    cooldownDelay: 20
})
export class EmojiUsageCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName('emojis')
                    .setDescription('The emojis (space separated) to collect info on.')
            )
            .addUserOption((option) =>
                option
                    .setName('member')
                    .setDescription('The user to count statistics for.')
            )
            .addBooleanOption((option) =>
                option
                    .setName('count-reactions')
                    .setDescription('Whether or not to count reactions in usage.  Defaults to True.')
            )
            ,
            this.slashCommandOptions
        )

        registry.registerContextMenuCommand((builder) => builder
            .setName(`Track Emoji Usage`)
            .setType(2 /* User */)
            ,
            this.contextCommandOptions
        )
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const guild = interaction.guild!;
        const user = interaction.options.getUser('member')!;
        const emojiString = interaction.options.getString('emojis');
        const countReactions = interaction.options.getBoolean('count-reactions');
        var emojis: Collection<string, GuildEmoji> | undefined;
        if (emojiString) {
            var matches = Array.from(emojiString.matchAll(REGEX_CUSTOM_EMOJI), m => m[0]);
            emojis = guild!.emojis.cache.filter(e => matches.indexOf(e.toString()) !== -1)
            if (emojis.size === 0) {
                this.error("Please enter a valid custom emoji.", emojiString);
            }
        }
        await this.run({
            guild,
            messageOrInteraction: interaction,
            user: interaction.user,
            options: {
                "count-reactions": countReactions,
                emojis,
                member: user,
            }
        });
    }

    public override async contextMenuRun(interaction: Command.ContextMenuCommandInteraction, _context: ContextMenuCommandContext) {
        if (interaction.isUserContextMenuCommand()) {
            const guild = interaction.guild!;
            const user = interaction.targetUser;
            await this.run({
                guild,
                messageOrInteraction: interaction,
                user: interaction.user,
                options: {
                    "count-reactions": true,
                    member: user,
                }
            });
        }
    }

    protected async generateFollowUp(messageOrInteraction: Message | ChatInputCommandInteraction | Command.ContextMenuCommandInteraction) {
        if (messageOrInteraction instanceof Message && messageOrInteraction.channel instanceof TextChannel) {
            messageOrInteraction = await messageOrInteraction.channel?.send({
                content: `Scanning...`
            })

            return async (options: string | MessagePayload | MessageReplyOptions) => (messageOrInteraction as Message).reply(options);
        } else if (messageOrInteraction instanceof ChatInputCommandInteraction) {
            if (!messageOrInteraction.replied) {
                await messageOrInteraction.reply({
                    content: `Scanning...`,
                });
            }
            return async (options: string | MessagePayload | InteractionEditReplyOptions) => (messageOrInteraction as CommandInteraction).editReply(options) as Promise<Message<boolean>>;
        } else {
            return async (options: string | MessagePayload | InteractionEditReplyOptions) => (messageOrInteraction as Command.ContextMenuCommandInteraction).editReply(options) as Promise<Message<boolean>>;
        }
    }

    public async run(args: {
        messageOrInteraction: Message | ChatInputCommandInteraction | Command.ContextMenuCommandInteraction,
        guild: Guild,
        user: User,
        options: EmojiUsageCommand.CommandOptions
    }) {
        const { messageOrInteraction, guild, user, options } = args;

        const followUp = await this.generateFollowUp(messageOrInteraction);

        const replyInterval = Time.Second * 5;

        const output: Record<string, {
            number: number,
            finished: boolean,
        }> = {};

        const bulkListener = async (channel, messages) => {
            if (!output[channel.id]) {
                output[channel.id] = {
                    number: 0,
                    finished: false
                };
            }
            output[channel.id].number += messages.size;
        };
        const channelListener = async (channel) => {
            if (!output[channel.id]) {
                output[channel.id] = {
                    number: 0,
                    finished: false
                };
            }
            output[channel.id].finished = true;
        };

        container.client.on(GuildMessageScanner.Events.Chunk.Finished, bulkListener);
        container.client.on(GuildMessageScanner.Events.Channel.ScanEnded, channelListener);

        let previous: Record<string, {
            number: number,
            finished: boolean,
        }> = {};

        const RETRY_COUNT = 15;
        var remainingRetries = RETRY_COUNT;

        const interval = setInterval(async () => {
            if (remainingRetries === 0) {
                followUp(`Timed out.`);
                clearInterval(interval);
                return;
            }

            if (JSON.stringify(previous) === JSON.stringify(output)) {
                --remainingRetries;
            } else {
                remainingRetries = RETRY_COUNT;
                const embed = new PuppyBotEmbed({
                    title: `Scanned Messages:`
                }).splitFields({
                    content: Object.entries(output).map((value) => {
                        const channel = guild.channels.cache.get(value[0]) as GuildTextBasedChannel;
                        return `${channel}: ${value[1].number}...${value[1].finished ? `**Done**!` : ``}`
                    })
                })
                await followUp({
                    embeds: [embed]
                });
            }

            previous = {
                ...output
            };
        }, replyInterval);

        const newReplyStopwatch = new Stopwatch();
        var { records } = await guild.emojiUsage.startCollecting();
        newReplyStopwatch.stop();

        clearInterval(interval);
        container.client.removeListener(GuildMessageScanner.Events.Chunk.Finished, bulkListener);
        container.client.removeListener(GuildMessageScanner.Events.Channel.ScanEnded, channelListener);


        const message = await followUp(`Scanning finished: `);

        let response: Message;
        if (newReplyStopwatch.duration > WAIT_DURATION_FOR_FOLLOWUP) {
            response = await message.reply(`Generating embed...`);
            await message.edit(`${message.content}${response.url}`);
        } else {
            response = message;
        }

        if (options.emojis?.size ?? 0 > 0) {
            records = records.filter((_value, key) => options.emojis!.has(key.toString()));
        } else {
            for (var [_, emoji] of guild.emojis.cache) {
                if (records.has(emoji.id)) continue;

                records.set(emoji.id, {
                    emojiId: emoji.id,
                    userRecords: new Collection()
                })
            }
        }

        records = records.filter((_value, key) => guild.emojis.cache.has(key.toString()))

        if (options.member) {
            records.mapValues(record => {
                record.userRecords = record.userRecords.filter((value) => value.userId === options.member!.id)
                return record;
            })
        }

        const paginatedMessage = new EmojiUsagePaginatedMessage(records, {
            emojiIdFilter: options.emojis?.map(emoji => emoji.id as unknown as [emojiId: string]) ?? [],
            guild: guild,
            countReactions: options["count-reactions"] ?? true,
            userIdFilter: (options.member?.id) ? [options.member.id as unknown as [userId: string]] : [],
        })

        await paginatedMessage.run(response, user);
    };

    // if (emojis) {
    //     paginatedMessage
    //         .addAction({
    //             customId: 'select-user',
    //             maxValues: 1,
    //             options: guild.members.cache.map(m => { return { value: m.id, label: m.displayName } as MessageSelectOptionData }).concat({ value: 'all', label: 'All Members' }),
    //             type: ComponentType.StringSelect,
    //             run: async ({ handler, interaction, collector }) => {
    //                 const page = handler.pages[handler.index] as PaginatedMessagePage;

    //                 if (interaction.isStringSelectMenu()) {
    //                     interaction.values
    //                     collector.removeAllListeners();
    //                     interaction.deferred = false;
    //                     interaction.replied = false;
    //                     return interaction.reply({ embeds: [] });
    //                 }
    //             }
    //         })
    // }
}

export namespace EmojiUsageCommand {
    export interface CommandStructure extends PuppyBotCommand.CommandStructure {
        'emojis'?: Collection<string, GuildEmoji> | null,
        'member'?: User | null,
        'count-reactions'?: boolean | null,
    }

    export type ValidOption = {
        [o in keyof CommandStructure]: o
    }[keyof CommandStructure];

    // export type CommandOptionsRecord<S extends ValidSubCommand | undefined, O extends ValidOption<S>> = Record<O, ValidOptionType<S, O>>
    export type CommandOptions = {
        [o in keyof CommandStructure]: CommandStructure[o]
    }
}