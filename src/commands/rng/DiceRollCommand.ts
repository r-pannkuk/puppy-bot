import { Args, ApplicationCommandRegistry, ChatInputCommandContext, UserError } from '@sapphire/framework'
import { Message, User, CommandInteraction, GuildMember, ButtonInteraction, Constants, MessageActionRow, MessageButton, Collection } from 'discord.js'
import { MessageEmbed } from 'discord.js'
import 'dotenv/config'
import { DiceRoll, Parser } from '@dice-roller/rpg-dice-roller'
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand'

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'roll',
    aliases: ['dice'],
    description: 'Rolls a combination of dice.',
    detailedDescription: `Rolls a combination of dice. Can throw up to 100 dice with up to 9999 sides. Must throw at least one die and only dice with 2 or more sides.  Examples:\n-- \`\`roll 3d6\`\`\n-- \`\`roll 4d8\`\`\n-- \`\`roll 3d6 4d8\`\``,
    requiredUserPermissions: ['SEND_MESSAGES'],
    requiredClientPermissions: ['SEND_MESSAGES'],
    nsfw: false
})
export class DiceRollCommand extends PuppyBotCommand {
    protected cachedQuery: Collection<string, {
        notation: string
    }> = new Collection();

    protected static validDice = (parameter: string) => {
        try {
            Parser.parse(parameter);
        } catch (e) {
            if (!(e instanceof Error)) {
                throw e;
            }

            if (e.name === 'SyntaxError') {
                throw new UserError({
                    context: parameter,
                    identifier: "Please check the notation and try again.  Examples:\n" +
                        "-- \`\`1d6\`\` - Roll 1 six-sided die.\n" +
                        "-- \`\`1d6 + 5\`\` - Roll 1 six-sided die and add 5 to the result.\n" +
                        "-- \`\`1d6 + 2d4\`\` - Roll 1 six-sided die and add 2 four-sided dice to the result.\n" +
                        "-- \`\`3d6min3\`\` - Roll 3 six-sided dice but values less than 3 are treated as 3.\n" +
                        "-- \`\`3d6max3\`\` - Roll 3 six-sided dice but values more than 3 are treated as 3.\n" +
                        "-- \`\`3d6!\`\` - Roll 3 six-sided dice and explode any rolls equal to the max.\n" +
                        "-- \`\`3d6!>=5\`\` - Roll 3 six-sided dice and explode any rolls greater than or equal to 5.\n" +
                        "-- \`\`3d6r1\`\` - Roll 3 six-sided dice and re-roll any 1's.\n" +
                        "-- \`\`3d6ro1\`\` - Roll 3 six-sided dice and re-roll any 1's only once at most.\n" +
                        "-- \`\`3d6kh2\`\` - Roll 3 six-sided dice and keep the highest two.\n" +
                        "-- \`\`3d6kl2\`\` - Roll 3 six-sided dice and keep the lowest two.\n" +
                        "-- \`\`3d6dh2\`\` - Roll 3 six-sided dice and drop the highest two.\n" +
                        "-- \`\`3d6dl2\`\` - Roll 3 six-sided dice and drop the lowest two.\n" +
                        "-- \`\`3d6>=5\`\` - Roll 3 six-sided dice and mark the rolls greater than or equal to 5.\n" +
                        "-- \`\`3d6>=5f<3\`\` - Roll 3 six-sided dice and mark the rolls greater than or equal to 5 as succeses, and the rolls less than 3 as failures.\n" +
                        "-- \`\`3d6s\`\` - Roll 3 six-sided dice and sort the results.\n" +
                        "-- \`\`3d6sd\`\` - Roll 3 six-sided dice and sort the results descending.\n" +
                        "-- \`\`{3d6, 3d6, 3d6}\`\` - Roll 3 pairs of 3 six-sided dice.\n" +
                        "-- \`\`round(3d6/2)\`\` - Roll 3 six-sided dice, divide the result by two, and round the result.\n" +
                        "-- \`\`floor(3d6/2)\`\` - Roll 3 six-sided dice, divide the result by two, and round down the result.\n" +
                        "-- \`\`ceiling(3d6/2)\`\` - Roll 3 six-sided dice, divide the result by two, and round up the result.\n"
                });
            } else if (e.name === "RangeError") {
                throw new UserError({
                    context: parameter,
                    identifier: `Range was invalid.`,
                    message: "Please make sure you are using only 1 to 999 dice."
                });
            }
        }
    }

    private static validDiceArgCheck = Args.make<string>((parameter, context) => {
        try {
            DiceRollCommand.validDice(parameter);
            return Args.ok(parameter);
        } catch (e) {
            if (e instanceof UserError) {
                return Args.error({
                    parameter: parameter,
                    context: context,
                    message: e.message,
                    identifier: e.identifier,
                    argument: context.argument
                })
            } else {
                throw e;
            }
        }
    })

    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        registry.registerChatInputCommand((builder) => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("notation")
                    .setDescription("Dice notation to use.")
            ),
            this.slashCommandOptions
        )
    }

    // private flattenResults(results: (string | number | Results.RollResults | Results.ResultGroup)[], parsedInput: any[]): {
    //     notation: string,
    //     result: string,
    //     total: string
    // }[] {
    //     var output : {
    //         notation: string,
    //         result: string,
    //         total: string
    //     }[] = []

    //     var entry = {
    //         notation: "",
    //         result: "",
    //         total: ""
    //     }

    //     for (var i in results) {
    //         var result = results[i]
    //         var input = parsedInput[i]

    //         if (result instanceof Results.ResultGroup) {
    //             if (input instanceof RollGroup) {
    //                 input = input.expressions
    //             }
    //             output = output.concat(this.flattenResults(result.results, input))
    //             entry.total = result.value.toString()
    //         } else {
    //             entry.notation += input.toString();
    //             entry.result += result.toString();
    //         }
    //     }

    //     if(entry.notation !== "" && entry.result !== "") {
    //         output.push(entry)
    //     }

    //     return output
    // }

    public async generateEmbed(user: User | GuildMember, results: DiceRoll, rerollAmount?: number) {
        const exportedResults = JSON.parse(results.export()!);

        console.log(exportedResults);

        exportedResults.rolls[0].results

        var embed = new MessageEmbed()
            .setColor(14400597)
            .setAuthor({
                name: `Dice roll: ${results.notation}`,
                iconURL: 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423'
            })
            .setDescription(`${user} got **${results.total}**!\n\n${results.toString()}`)


        if (user instanceof GuildMember) {
            var username = user.displayName;
        } else {
            var username = user.username;
        }

        embed.setFooter({
            "text": `${username}${(rerollAmount) ? ` - Rerolled ${rerollAmount} time${(rerollAmount === 1) ? `` : `s`}.` : ``}`,
            "iconURL": user.avatarURL() || ""
        })

        return embed;
    }

    public async run(messageOrInteraction: Message | CommandInteraction, user: User | GuildMember, processedInput: string) {
        const followUp = await this.generateFollowUp(messageOrInteraction);

        var rerollAmount = 0;
        const results = new DiceRoll(processedInput);

        const generateEmbed = async () => {
            const embed = this.generateEmbed(user, results, rerollAmount);
            ++rerollAmount;
            return embed;
        }

        const customId = 'DiceRollCommand.reroll';

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(customId)
                    .setLabel('Re-Roll')
                    .setStyle(Constants.MessageButtonStyles.SECONDARY)
            );

        // What the fuck.
        const response = messageOrInteraction.channel?.messages.cache.get((await followUp({ embeds: [await generateEmbed()], components: [row] })).id)!;
        this.cachedQuery.set(messageOrInteraction.guildId ?? user.id, {
            notation: processedInput
        });
        response.createMessageComponentCollector({
            componentType: Constants.MessageComponentTypes.BUTTON,
            filter: (interaction: ButtonInteraction) => interaction.customId === customId && interaction.user.id === user.id
        }).addListener('collect', async (interaction: ButtonInteraction) => {
            await interaction.update({ embeds: [await generateEmbed()] })
        })
    }

    public override async messageRun(message: Message, input: Args) {
        var results = await input.restResult(DiceRollCommand.validDiceArgCheck);
        let processedInput: string;
        if (results.isErr()) {
            processedInput = this.cachedQuery.get(message.guildId ?? message.author.id)?.notation
                ?? 'd20';
        } else {
            processedInput = results.unwrap().replace('\W', "")
        }
        await this.run(message, message.author, processedInput);
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        var processedInput = interaction.options.get('notation')?.value?.toString().replace('\W', "")
            ?? this.cachedQuery.get(interaction.guildId ?? interaction.user.id)?.notation
            ?? 'd20';
        DiceRollCommand.validDice(processedInput);

        await this.run(interaction, interaction.user, processedInput);

    }
};