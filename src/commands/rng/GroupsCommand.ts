import type { Args, ApplicationCommandRegistry, ChatInputCommandContext } from '@sapphire/framework'
import { Message, ActionRowBuilder, ButtonInteraction, Collection, EmbedBuilder, ChatInputCommandInteraction, ButtonStyle, ButtonBuilder, ComponentType, MessageReplyOptions } from 'discord.js'
import 'dotenv/config'
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand'
import type { User } from '@sentry/node'

const SHORT_DESCRIPTION = 'Constructs random teams of size N with the provided list of entrants.';

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'groups',
    aliases: ['teams', 'team', 'group'],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + "\nExample:\n--\`\`!groups 2 Dog Doggo Doggete Doglord Dogbug Dogive\`\`",
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    nsfw: false
})
export class GroupsCommand extends PuppyBotCommand {
    public cachedQuery: Collection<string, {
        size: number,
        entries: string | string[],
    }> = new Collection();

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addIntegerOption((option) =>
                option
                    .setName("size")
                    .setDescription("Enter the size that each team should be.")
            )
            .addStringOption((option) =>
                option
                    .setName("entries")
                    .setDescription("Please enter the items to make up the groups with")
            ),
            this.slashCommandOptions
        )
    }

    public generateEmbed(groupSize: number, entries: readonly string[], rerollAmount?: number) {
        var groups = new Array<Array<string>>();
        var numGroups = Math.ceil(entries.length / groupSize);

        for (var i = 0; i < numGroups; ++i) {
            groups.push([]);
        }

        for (var i = 0; i < entries.length;) {
            var groupIndex = Math.floor(Math.random() * numGroups);

            if (groups[groupIndex].length === groupSize) {
                continue;
            }

            const currentEntry = entries[i];

            if (currentEntry !== undefined) {
                groups[groupIndex].push(currentEntry);
            }

            ++i;
        }

        var embed = new EmbedBuilder();

        groups.forEach((group, index) => {
            embed.addFields({
                name: `Group ${index + 1}:`,
                value: group.sort().reduce((p, c) => p + c + `\n`, ``),
                inline: true
            });
        });

        if (rerollAmount) {
            embed.setFooter({
                text: `Rerolled ${rerollAmount} time${(rerollAmount === 1) ? `` : `s`}.`
            });
        }

        return embed;
    }

    public async run(messageOrInteraction: Message<boolean> | ChatInputCommandInteraction, user: User, groupSize?: number | null, entries?: string | string[] | null) {
        const followUp = await this.generateFollowUp(messageOrInteraction);

        if (!groupSize || groupSize <= 0) {
            this.error("Invalid group size.  Please choose a number greater than 0.", groupSize);
        }

        if (!entries || entries.length === 0) {
            this.error("Invalid number of entries.  Please provide a space-separated list.", entries);
        }

        let processedEntries: string[] | undefined;
        if (typeof entries === 'string') {
            processedEntries = entries.match(/[^\s"]+|"([^"]*)"/g)?.map(s => s.replace(new RegExp(/[\'\"]/, 'g'), ""))
        } else {
            processedEntries = entries;
        }

        if (!processedEntries) {
            this.error(`Could not parse entries.`, entries);
        }

        var rerollAmount = 0;
        const generateEmbed = () => {
            var embed = this.generateEmbed(Number(groupSize), processedEntries!, rerollAmount)
            ++rerollAmount;
            return embed;
        }

        const customId = 'GroupsCommand.reroll';

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(customId)
                    .setLabel('Re-Roll')
                    .setStyle(ButtonStyle.Secondary)
            )

        const followUpMessage = await followUp({
            embeds: [await generateEmbed()],
            components: [row]
        } as MessageReplyOptions)
        const response = messageOrInteraction.channel?.messages.cache.get(followUpMessage.id)!;
        response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (interaction: ButtonInteraction) => interaction.customId === customId && interaction.user.id === user.id
        }).addListener('collect', async (interaction: ButtonInteraction) => {
            await interaction.update({ embeds: [generateEmbed()] })
        })

        this.cachedQuery.set(messageOrInteraction.guildId ?? user.id!.toString(), {
            size: groupSize,
            entries,
        })
    }

    public override async messageRun(message: Message, input: Args) {
        const groupSize = Number(input.getOption('size')) ?? this.cachedQuery.get(message.guildId ?? message.author.id)?.size;
        const entries = await input.repeat('string') ?? this.cachedQuery.get(message.guildId ?? message.author.id)?.entries;

        await this.run(message, message.author, groupSize, entries);
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const groupSize = interaction.options.getInteger('size') ?? this.cachedQuery.get(interaction.guildId ?? interaction.user.id)?.size
        const entries = interaction.options.getString('entries') ?? this.cachedQuery.get(interaction.guildId ?? interaction.user.id)?.entries;

        await this.run(interaction, interaction.user, groupSize, entries);
    }
};