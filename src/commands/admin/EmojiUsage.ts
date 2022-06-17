import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry, ChatInputCommandContext, ContextMenuCommandContext } from "@sapphire/framework";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import { Collection, CommandInteraction, ContextMenuInteraction, Guild, GuildEmoji, Message, User } from "discord.js";
import { EmojiUsagePaginatedMessage } from "../../lib/structures/message/admin/EmojiUsagePaginatedMessage";
import { Stopwatch } from '@sapphire/stopwatch';

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
    requiredUserPermissions: ['ADMINISTRATOR'],
    requiredClientPermissions: ['VIEW_CHANNEL'],
    nsfw: false,
    runIn: 'GUILD_ANY',
    options: ['emoji', 'member', 'count-reactions'],
    cooldownLimit: 1,
    cooldownDelay: 20
})
export class EmojiUsageCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry, new SlashCommandBuilder()
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
        )

        this.registerContextMenuCommand(registry, new ContextMenuCommandBuilder()
            .setName(`Track Emoji Usage`)
            .setType(2 /* User */)
        )
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
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

    public override async contextMenuRun(interaction: ContextMenuInteraction, _context: ContextMenuCommandContext) {
        if (interaction.isUserContextMenu()) {
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

    public async run(args: {
        messageOrInteraction: Message | CommandInteraction | ContextMenuInteraction,
        guild: Guild,
        user: User,
        options: EmojiUsageCommand.CommandOptions
    }) {
        const { messageOrInteraction, guild, user, options } = args;

        const followUp = await this.generateFollowUp(messageOrInteraction);

        const stopwatch = new Stopwatch();
        var { records } = await guild.emojiUsage.startCollecting();
        stopwatch.stop();

        const message = await followUp(`Scanning finished: `);
        
        let response : Message;
        if (stopwatch.duration > WAIT_DURATION_FOR_FOLLOWUP) {
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
    //             type: Constants.MessageComponentTypes.SELECT_MENU,
    //             run: async ({ handler, interaction, collector }) => {
    //                 const page = handler.pages[handler.index] as PaginatedMessagePage;

    //                 if (interaction.isSelectMenu()) {
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