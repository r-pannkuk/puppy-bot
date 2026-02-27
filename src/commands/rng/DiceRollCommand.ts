/**
 * @file DiceRollCommand.ts
 * @description `/roll` command — rolls dice using full RPG notation.
 *
 * Uses `@dice-roller/rpg-dice-roller` to parse and execute notation strings
 * such as `3d6`, `4d8kh3`, `2d6!>=5`, `{3d6, 3d6}`, etc.
 *
 * Supports optional Pathfinder character-sheet token references (`[STR]`,
 * `[Perception]`, `[Longsword:ATK]`, `[C32]`, etc.).  When tokens are present
 * the active (or most recently used) character sheet is read live via the
 * Google Sheets API and the substituted notation is rolled normally.
 *
 * Aliases: `dice`.  Cooldown: 5 s / 6 uses per channel.
 * Re-roll button: intentionally omitted (live sheet values may change).
 */
import { Args, ApplicationCommandRegistry, ChatInputCommandContext, UserError, container } from '@sapphire/framework'
import { Collection, ChatInputCommandInteraction, EmbedBuilder, Message, User, GuildMember } from 'discord.js'
import 'dotenv/config'
import { DiceRoll, Parser } from '@dice-roller/rpg-dice-roller'
import { ApplyOptions } from '@sapphire/decorators'
import { PuppyBotCommand } from '../../lib/structures/command/PuppyBotCommand'
import { Time } from '@sapphire/time-utilities'
import { PathfinderManager } from '../../lib/structures/managers/PathfinderManager'
import { hasTokens, resolveTokens } from '../../lib/utils/pathfinderRoll'

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'roll',
    aliases: ['dice'],
    cooldownDelay: 5 * Time.Second,
    cooldownLimit: 6,
    description: 'Rolls a combination of dice.',
    detailedDescription: `Rolls a combination of dice. Can throw up to 100 dice with up to 9999 sides. Must throw at least one die and only dice with 2 or more sides.  Examples:\n-- \`\`roll 3d6\`\`\n-- \`\`roll 4d8\`\`\n-- \`\`roll 3d6 4d8\`\``,
    requiredUserPermissions: ["SendMessages"],
    requiredClientPermissions: ["SendMessages"],
    nsfw: false
})
export class DiceRollCommand extends PuppyBotCommand {
    protected readonly pathfinderManager = new PathfinderManager();

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
                    .setName('notation')
                    .setDescription('Dice notation to use. Supports [StatRef] tokens when a character is set with /character use.')
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

    public async generateEmbed(
        user: User | GuildMember,
        results: DiceRoll,
        originalNotation?: string,
        damageType?: string | null,
        characterName?: string | null,
    ) {
        const username = user instanceof GuildMember ? user.displayName : user.username;

        // Resolved-notation line — shown before the result line, per spec embed layout.
        let resolvedLine = '';
        if (originalNotation && originalNotation !== results.notation) {
            if (damageType) {
                resolvedLine = `*(resolved: \`${results.notation}\` — **${damageType}**)*\n`;
            } else {
                resolvedLine = `*(resolved: \`${results.notation}\`)*\n`;
            }
        }

        // Result line: "X got Y" or "X dealt Y <type>".
        const descriptionLine = damageType
            ? `${user} dealt **${results.total}** ${damageType}!`
            : `${user} got **${results.total}**!`;

        const embed = new EmbedBuilder()
            .setColor(14400597)
            .setAuthor({
                name: `Dice roll: ${originalNotation ?? results.notation}`,
                iconURL: 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423',
            })
            .setDescription(`${resolvedLine}${descriptionLine}\n\n${results.toString()}`);

        const footerOptions: { text: string; iconURL?: string } = {
            text: characterName ? `${characterName} · ${username}` : username,
        };
        const avatarUrl = user.avatarURL();
        if (avatarUrl) footerOptions.iconURL = avatarUrl;
        embed.setFooter(footerOptions);

        return embed;
    }

    public async run(
        messageOrInteraction: Message | ChatInputCommandInteraction,
        user: User | GuildMember,
        resolvedNotation: string,
        originalNotation?: string,
        damageType?: string | null,
        characterName?: string | null,
    ) {
        const followUp = await this.generateFollowUp(messageOrInteraction);

        const results = new DiceRoll(resolvedNotation);
        const embed = await this.generateEmbed(user, results, originalNotation, damageType, characterName);

        await followUp({ embeds: [embed] });

        this.cachedQuery.set(messageOrInteraction.guildId ?? user.id, {
            notation: originalNotation ?? resolvedNotation,
        });
    }

    public override async messageRun(message: Message, input: Args) {
        const result = await input.restResult(DiceRollCommand.validDiceArgCheck);
        let notation: string;
        if (result.isErr()) {
            notation = this.cachedQuery.get(message.guildId ?? message.author.id)?.notation ?? 'd20';
        } else {
            notation = result.unwrap().trim();
        }

        if (hasTokens(notation) && message.guildId) {
            // Token resolution — active character is required.
            const character =
                await this.pathfinderManager.getActive(message.guildId, message.author.id) ??
                await this.pathfinderManager.getLastUsed(message.guildId, message.author.id);
            if (!character) {
                throw new UserError({
                    identifier: 'No character found. Register one with `/character register` and select it with `/character use`.',
                });
            }

            const sheetConfig = await container.database.pathfinderSheetConfig.findFirst({
                where: { guildId: message.guildId },
                orderBy: { version: 'desc' },
            });

            const { resolved, damageType } = await resolveTokens(notation, character.sheetUrl, sheetConfig);
            DiceRollCommand.validDice(resolved);
            await this.pathfinderManager.touchLastUsed(character.id);
            await this.run(message, message.author, resolved, notation, damageType, character.name);
        } else {
            // Best-effort character lookup — shows name in embed but never errors.
            let characterName: string | null = null;
            if (message.guildId) {
                const character =
                    await this.pathfinderManager.getActive(message.guildId, message.author.id) ??
                    await this.pathfinderManager.getLastUsed(message.guildId, message.author.id);
                characterName = character?.name ?? null;
            }
            DiceRollCommand.validDice(notation);
            await this.run(message, message.author, notation, undefined, undefined, characterName);
        }
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const notation = (interaction.options.getString('notation')?.trim()
            ?? this.cachedQuery.get(interaction.guildId ?? interaction.user.id)?.notation
            ?? 'd20');

        if (hasTokens(notation) && interaction.guildId) {
            const guildId = interaction.guildId;
            const ownerId = interaction.user.id;

            // Character resolution: active (set via /character use) → most recently used.
            const character =
                await this.pathfinderManager.getActive(guildId, ownerId) ??
                await this.pathfinderManager.getLastUsed(guildId, ownerId);

            if (!character) {
                throw new UserError({
                    identifier: 'No character found. Register one with `/character register` and select it with `/character use`.',
                });
            }

            const sheetConfig = await container.database.pathfinderSheetConfig.findFirst({
                where: { guildId },
                orderBy: { version: 'desc' },
            });

            const { resolved, damageType } = await resolveTokens(notation, character.sheetUrl, sheetConfig);
            DiceRollCommand.validDice(resolved);
            await this.pathfinderManager.touchLastUsed(character.id);
            await this.run(interaction, interaction.user, resolved, notation, damageType, character.name);
        } else {
            // Best-effort character lookup — shows name in embed but never errors.
            let characterName: string | null = null;
            if (interaction.guildId) {
                const character =
                    await this.pathfinderManager.getActive(interaction.guildId, interaction.user.id) ??
                    await this.pathfinderManager.getLastUsed(interaction.guildId, interaction.user.id);
                characterName = character?.name ?? null;
            }
            DiceRollCommand.validDice(notation);
            await this.run(interaction, interaction.user, notation, undefined, undefined, characterName);
        }
    }
};