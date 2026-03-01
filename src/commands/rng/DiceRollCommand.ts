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
 * Multi-roll: semicolons separate independent roll expressions.
 *   `1d20+5 ; 1d20+[fly] ; 1d20+1d4`
 * Each segment resolves and rolls independently (token substitution and full-attack
 * expansion all apply per segment).  All results are combined into a single embed
 * with one field per roll.  A single-segment notation (no `;`) behaves as before.
 *
 * Full-attack expansion: when a notation segment contains `[Name:ATK]` with no
 * explicit attack index, `resolveAllAttacks` splits the raw attack cell on `/` and
 * produces one field per iterative bonus within the multi-roll embed.
 * A named index (`[Name:ATK:2]`) still selects only that specific bonus.
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
import { hasTokens, resolveAllAttacks } from '../../lib/utils/pathfinderRoll'

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

    /** Splits a raw notation string on `;`, trims each part, drops empty parts. */
    private static splitSegments(notation: string): string[] {
        return notation.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
    }

    private static validDiceArgCheck = Args.make<string>((parameter, context) => {
        try {
            // Split on semicolons so multi-roll input is validated segment-by-segment.
            // Skip parser validation per segment when tokens are present — bare aliases
            // like `will` or `STR` aren't valid dice notation on their own and would
            // cause a false SyntaxError.  Full validation runs after resolution.
            const segments = DiceRollCommand.splitSegments(parameter);
            for (const segment of segments) {
                if (!hasTokens(segment)) {
                    DiceRollCommand.validDice(segment);
                }
            }
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
                    .setDescription('Dice notation. Semicolons for multiple rolls: 1d20+5 ; [fly] ; 1d6+STR. Supports [StatRef] tokens.')
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

    public async generateIterativeEmbed(
        user: User | GuildMember,
        rolls: DiceRoll[],
        originalNotation: string,
        damageType?: string | null,
        characterName?: string | null,
    ) {
        const username = user instanceof GuildMember ? user.displayName : user.username;
        const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

        const embed = new EmbedBuilder()
            .setColor(14400597)
            .setAuthor({
                name: `Full attack: ${originalNotation}`,
                iconURL: 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423',
            });

        for (let i = 0; i < rolls.length; i++) {
            const roll = rolls[i];
            const label = ordinals[i] ?? `${i + 1}th`;
            const resultLine = damageType
                ? `**${roll.total}** ${damageType}`
                : `**${roll.total}**`;
            const resolvedLine = originalNotation !== roll.notation
                ? (damageType
                    ? `*(Resolved: \`${roll.notation}\` — **${damageType}**)*\n`
                    : `*(Resolved: \`${roll.notation}\`)*\n`)
                : '';
            embed.addFields([{
                name: `${label} Attack`,
                value: `${resolvedLine}${resultLine}\n${roll.toString()}`,
                inline: false,
            }]);
        }

        const footerOptions: { text: string; iconURL?: string } = {
            text: characterName ? `${characterName} · ${username}` : username,
        };
        const avatarUrl = user.avatarURL();
        if (avatarUrl) footerOptions.iconURL = avatarUrl;
        embed.setFooter(footerOptions);

        return embed;
    }

    public async generateMultiRollEmbed(
        user: User | GuildMember,
        segments: Array<{
            originalNotation: string;
            rolls: DiceRoll[];
            damageType: string | null;
        }>,
        fullOriginalNotation: string,
        characterName?: string | null,
    ) {
        const username = user instanceof GuildMember ? user.displayName : user.username;
        const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

        const embed = new EmbedBuilder()
            .setColor(14400597)
            .setAuthor({
                name: `Dice roll: ${fullOriginalNotation}`,
                iconURL: 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423',
            });

        for (const segment of segments) {
            if (segment.rolls.length === 1) {
                const roll = segment.rolls[0];
                const resultLine = segment.damageType
                    ? `**${roll.total}** ${segment.damageType}`
                    : `**${roll.total}**`;
                embed.addFields([{
                    name: segment.originalNotation,
                    value: `${resultLine}\n${roll.toString()}`,
                    inline: false,
                }]);
            } else {
                // Iterative attacks within this segment.
                for (let i = 0; i < segment.rolls.length; i++) {
                    const roll = segment.rolls[i];
                    const ordinal = ordinals[i] ?? `${i + 1}th`;
                    const resultLine = segment.damageType
                        ? `**${roll.total}** ${segment.damageType}`
                        : `**${roll.total}**`;
                    // First attack field carries the original notation as context.
                    const fieldName = i === 0
                        ? `${segment.originalNotation} — ${ordinal} Attack`
                        : `${ordinal} Attack`;
                    embed.addFields([{
                        name: fieldName,
                        value: `${resultLine}\n${roll.toString()}`,
                        inline: false,
                    }]);
                }
            }
        }

        const footerOptions: { text: string; iconURL?: string } = {
            text: characterName ? `${characterName} · ${username}` : username,
        };
        const avatarUrl = user.avatarURL();
        if (avatarUrl) footerOptions.iconURL = avatarUrl;
        embed.setFooter(footerOptions);

        return embed;
    }

    public async runMulti(
        messageOrInteraction: Message | ChatInputCommandInteraction,
        user: User | GuildMember,
        segments: Array<{
            originalNotation: string;
            rolls: DiceRoll[];
            damageType: string | null;
        }>,
        fullOriginalNotation: string,
        characterName?: string | null,
    ) {
        const followUp = await this.generateFollowUp(messageOrInteraction);
        const embed = await this.generateMultiRollEmbed(user, segments, fullOriginalNotation, characterName);
        await followUp({ embeds: [embed] });
        const key = messageOrInteraction.guildId ?? (user instanceof GuildMember ? user.id : (user as User).id);
        this.cachedQuery.set(key, { notation: fullOriginalNotation });
    }

    public async runIterative(
        messageOrInteraction: Message | ChatInputCommandInteraction,
        user: User | GuildMember,
        resolvedNotations: string[],
        originalNotation: string,
        damageType?: string | null,
        characterName?: string | null,
    ) {
        const followUp = await this.generateFollowUp(messageOrInteraction);

        resolvedNotations.forEach((n) => DiceRollCommand.validDice(n));
        const rolls = resolvedNotations.map((n) => new DiceRoll(n));
        const embed = await this.generateIterativeEmbed(user, rolls, originalNotation, damageType, characterName);

        await followUp({ embeds: [embed] });

        const key = messageOrInteraction.guildId ?? (user instanceof GuildMember ? user.id : (user as User).id);
        this.cachedQuery.set(key, { notation: originalNotation });
    }

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
                resolvedLine = `*(Resolved: \`${results.notation}\` — **${damageType}**)*\n`;
            } else {
                resolvedLine = `*(Resolved: \`${results.notation}\`)*\n`;
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
        await this.executeRoll(message, message.author, notation, message.guildId);
    }

    public override async chatInputRun(interaction: ChatInputCommandInteraction, _context: ChatInputCommandContext) {
        const notation = (
            interaction.options.getString('notation')?.trim()
            ?? this.cachedQuery.get(interaction.guildId ?? interaction.user.id)?.notation
            ?? 'd20'
        );
        await this.executeRoll(interaction, interaction.user, notation, interaction.guildId);
    }

    /**
     * Shared execution path for both message and slash invocations.
     *
     * Splits the notation on `;`, resolves each segment (token substitution,
     * iterative-attack expansion), rolls, then dispatches to the appropriate
     * embed builder:
     * - 1 segment, 1 result  → `run` (single-roll embed)
     * - 1 segment, N results → `runIterative` (full-attack embed)
     * - N segments           → `runMulti` (multi-roll embed, one field per roll)
     */
    private async executeRoll(
        messageOrInteraction: Message | ChatInputCommandInteraction,
        user: User | GuildMember,
        fullNotation: string,
        guildId: string | null,
    ): Promise<void> {
        const segments = DiceRollCommand.splitSegments(fullNotation);
        const isMulti = segments.length > 1;
        const userId = user instanceof GuildMember ? user.id : (user as User).id;

        // -----------------------------------------------------------------------
        // Character resolution
        // -----------------------------------------------------------------------
        // If any segment has tokens, the character is required for resolution.
        // For token-free rolls we do a best-effort lookup (footer only, no errors).
        const needsCharacter = guildId !== null && segments.some((s) => hasTokens(s));
        let character: Awaited<ReturnType<PathfinderManager['getActive']>> = null;
        let sheetConfig: Awaited<ReturnType<typeof container.database.pathfinderSheetConfig.findFirst>> = null;

        if (guildId) {
            character =
                await this.pathfinderManager.getActive(guildId, userId) ??
                await this.pathfinderManager.getLastUsed(guildId, userId);

            if (needsCharacter && !character) {
                throw new UserError({
                    identifier: 'No character found. Register one with `/character register` and select it with `/character use`.',
                });
            }

            if (character && needsCharacter) {
                sheetConfig = await container.database.pathfinderSheetConfig.findFirst({
                    where: { guildId },
                    orderBy: { version: 'desc' },
                });
            }
        }

        const characterName = character?.name ?? null;

        // -----------------------------------------------------------------------
        // Resolve each segment to notation strings (no rolling yet)
        // -----------------------------------------------------------------------
        // Each entry holds the original text, one or more resolved notation strings
        // (>1 means iterative-attack expansion), and the damage type if any.
        type ResolvedSegment = { originalNotation: string; resolved: string[]; damageType: string | null };
        const resolvedSegments: ResolvedSegment[] = [];

        for (const segment of segments) {
            if (character && hasTokens(segment)) {
                const allResults = await resolveAllAttacks(segment, character.sheetUrl, sheetConfig);

                // If the user provided exactly a single offense ATK token like
                // `[Longsword:ATK]` (no other text), implicitly prepend `1d20+` so
                // they don't have to type `1d20+[Longsword:ATK]`.
                const isSingleAtkToken = /^\s*\[[^\]]+:(ATK|ATTACK)(?::\d+)?\]\s*$/i.test(segment);

                // Also detect a single bare/bracketed stat/skill token so we can
                // implicitly prepend `1d20+` for skill checks (e.g. `[Perception]` or `perc`).
                const singleTokenMatch = segment.trim().match(/^\s*(?:\[([^\]]+)\]|([^\[\]]+))\s*$/);
                let isSingleSkillToken = false;
                if (singleTokenMatch) {
                    const inner = (singleTokenMatch[1] ?? singleTokenMatch[2]).trim();
                    // If this inner token is an offense reference (ATK/DMG), skip skill handling.
                    const OFFENSE_RE = /^(.+?):(ATK|ATTACK|DMG|DAMAGE)(?::(\d+))?$/i;
                    if (!OFFENSE_RE.test(inner)) {
                        isSingleSkillToken = true;
                    }
                }

                const resolvedList = allResults.map((r) => {
                    let res = r.resolved;

                    if (isSingleAtkToken) {
                        // Only apply when the resolved value is a plain integer (e.g. "5" or "-1").
                        const n = parseInt(String(res).trim(), 10);
                        if (!Number.isNaN(n)) {
                            res = n >= 0 ? `1d20+${n}` : `1d20${n}`;
                        }
                    } else if (isSingleSkillToken) {
                        // For a single skill/ability token (resolved to a numeric bonus),
                        // treat it as `1d20+<bonus>`. Accept negative bonuses too.
                        const n = parseInt(String(res).trim(), 10);
                        if (!Number.isNaN(n)) {
                            res = n >= 0 ? `1d20+${n}` : `1d20${n}`;
                        }
                    }

                    return res;
                });

                resolvedList.forEach((s) => DiceRollCommand.validDice(s));
                resolvedSegments.push({
                    originalNotation: segment,
                    resolved: resolvedList,
                    damageType: allResults[0].damageType,
                });
            } else {
                DiceRollCommand.validDice(segment);
                resolvedSegments.push({ originalNotation: segment, resolved: [segment], damageType: null });
            }
        }

        if (character) await this.pathfinderManager.touchLastUsed(character.id);

        // -----------------------------------------------------------------------
        // Dispatch to the appropriate embed path
        // -----------------------------------------------------------------------
        if (!isMulti) {
            const seg = resolvedSegments[0];
            if (seg.resolved.length > 1) {
                // Single segment, multiple iterative attacks → iterative embed.
                await this.runIterative(
                    messageOrInteraction, user,
                    seg.resolved,
                    seg.originalNotation,
                    seg.damageType,
                    characterName,
                );
            } else {
                // Single segment, single roll → standard embed.
                const resolvedNotation = seg.resolved[0];
                await this.run(
                    messageOrInteraction, user,
                    resolvedNotation,
                    resolvedNotation !== seg.originalNotation ? seg.originalNotation : undefined,
                    seg.damageType,
                    characterName,
                );
            }
        } else {
            // Multiple segments → multi-roll embed; runMulti handles the actual rolling.
            const rollSegments = resolvedSegments.map((seg) => ({
                originalNotation: seg.originalNotation,
                rolls: seg.resolved.map((n) => new DiceRoll(n)),
                damageType: seg.damageType,
            }));
            await this.runMulti(messageOrInteraction, user, rollSegments, fullNotation, characterName);
        }
    }
};