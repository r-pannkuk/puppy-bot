/**
 * @file CharacterCommand.ts
 * @description The `/character` command group for managing per-guild Pathfinder
 * character sheet registrations.
 *
 * Subcommands (flat children of /character):
 *   register  <sheet_url> <name>  — register or re-register a character
 *   unregister <name>             — remove a character
 *   list                          — list all characters for the invoker
 *   equip     <name>              — set the active character and bump lastUsedAt
 *   unequip                       — clear the active character (opposite of /character use)
 *   info      [name]              — show live stats from the sheet
 *
 * Subcommand group (admin, owner-only):
 *   admin list-all                — list all characters in this guild
 *   admin register <user> <sheet_url> <name>
 *   admin unregister <user> <name>
 */
import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { UserError, container } from '@sapphire/framework';
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from 'discord.js';
import { PathfinderManager } from '../../lib/structures/managers/PathfinderManager';
import { validateSheetAccess, extractSheetId, batchGetValues, resolveNamedRanges } from '../../lib/utils/sheets';
import { env } from '../../lib/setup/schema';
import type { PathfinderSheetConfig } from '@prisma/client';

// Re-export SheetSchema type so it can be imported here
// (the interface is not exported from pathfinderRoll; duplicate it inline).
interface InternalSheetSchema {
    name: string;
    sheetName?: string;
    skills: Record<string, string>;
    abilities: Record<string, string>;
    saves: Record<string, string>;
    defenses: Record<string, string>;
    cmb: string;
    initiative: string;
    offenses: {
        name: string; attack: string; damage: string;
        crit: string; multiplier: string; range: string; type: string;
    }[];
    totals: { bab: string; level: string };
    health: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultSheetConfig = require('../../config/default/PathfinderSheetConfig.json') as {
    version: string; sheetName: string; schema: InternalSheetSchema;
};

@ApplyOptions<Subcommand.Options>({
    name: 'character',
    description: 'Manage Pathfinder character sheet registrations.',
        subcommands: [
        { name: 'register',   chatInputRun: 'subcommandRegister' },
        { name: 'unregister', chatInputRun: 'subcommandUnregister' },
        { name: 'list',       chatInputRun: 'subcommandList' },
            { name: 'equip',      chatInputRun: 'subcommandEquip' },
        { name: 'unequip',    chatInputRun: 'subcommandUnequip' },
        { name: 'info',       chatInputRun: 'subcommandInfo' },
        {
            name: 'admin',
            type: 'group',
            entries: [
                { name: 'list-all',   chatInputRun: 'subcommandAdminListAll' },
                { name: 'register',   chatInputRun: 'subcommandAdminRegister' },
                { name: 'unregister', chatInputRun: 'subcommandAdminUnregister' },
            ],
        },
    ],
})
export class CharacterCommand extends Subcommand {
    private readonly manager = new PathfinderManager();

    // -------------------------------------------------------------------------
    // Command registration
    // -------------------------------------------------------------------------

    public override registerApplicationCommands(registry: Subcommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)

                // /character register
                .addSubcommand((sub) =>
                    sub
                        .setName('register')
                        .setDescription('Register a character sheet.')
                        .addStringOption((o) =>
                            o.setName('sheet_url').setDescription('Full Google Sheets URL.').setRequired(true)
                        )
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Display name for this character.').setRequired(true)
                        )
                )

                // /character unregister
                .addSubcommand((sub) =>
                    sub
                        .setName('unregister')
                        .setDescription('Remove a registered character.')
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Character name to remove.').setRequired(true).setAutocomplete(true)
                        )
                )

                // /character list
                .addSubcommand((sub) =>
                    sub.setName('list').setDescription('List all your registered characters.')
                )

                // /character equip
                .addSubcommand((sub) =>
                    sub
                        .setName('equip')
                        .setDescription('Set your active character for rolls (token substitution and embed display).')
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Character name to use for rolls.').setRequired(true).setAutocomplete(true)
                        )
                )

                // /character unequip
                .addSubcommand((sub) =>
                    sub
                        .setName('unequip')
                        .setDescription('Clear your active character so no character is selected for rolls.')
                )

                // /character info
                .addSubcommand((sub) =>
                    sub
                        .setName('info')
                        .setDescription('Fetch live stats from a character sheet.')
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Character name (defaults to active character).').setAutocomplete(true)
                        )
                )

                // /character admin list-all
                .addSubcommandGroup((group) =>
                    group
                        .setName('admin')
                        .setDescription('Owner-only character management.')
                        .addSubcommand((sub) =>
                            sub.setName('list-all').setDescription('List all character registrations in this guild.')
                        )
                        .addSubcommand((sub) =>
                            sub
                                .setName('register')
                                .setDescription("Register a character on behalf of another user.")
                                .addUserOption((o) =>
                                    o.setName('user').setDescription('Target Discord user.').setRequired(true)
                                )
                                .addStringOption((o) =>
                                    o.setName('sheet_url').setDescription('Full Google Sheets URL.').setRequired(true)
                                )
                                .addStringOption((o) =>
                                    o.setName('name').setDescription('Character display name.').setRequired(true)
                                )
                        )
                        .addSubcommand((sub) =>
                            sub
                                .setName('unregister')
                                .setDescription("Remove a character from another user's registry.")
                                .addUserOption((o) =>
                                    o.setName('user').setDescription('Target Discord user.').setRequired(true)
                                )
                                .addStringOption((o) =>
                                    o.setName('name').setDescription('Character name to remove.').setRequired(true).setAutocomplete(true)
                                )
                        )
                ),
        );
    }

    // -------------------------------------------------------------------------
    // Autocomplete
    // -------------------------------------------------------------------------

    public override async autocompleteRun(interaction: AutocompleteInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) return interaction.respond([]);

        const focused = interaction.options.getFocused(true);
        if (focused.name !== 'name') return interaction.respond([]);

        const subcommand = interaction.options.getSubcommand(false);
        const subcommandGroup = interaction.options.getSubcommandGroup(false);

            // Admin unregister: autocomplete from the target user's characters.
            // `/character info` should autocomplete across all characters in the
            // guild (not limited to the invoking user's), while other subcommands
            // (e.g., equip/use) remain restricted to the invoking user's characters.
            let characters: { name: string }[] = [];
            if (subcommandGroup === 'admin' && subcommand === 'unregister') {
                const targetUserId = interaction.options.get('user')?.value as string | undefined;
                const ownerId = targetUserId ?? interaction.user.id;
                characters = await this.manager.listCharacters(guildId, ownerId);
            } else if (subcommand === 'info') {
                characters = await this.manager.listAll(guildId);
            } else {
                characters = await this.manager.listCharacters(guildId, interaction.user.id);
            }
        const query = focused.value.toLowerCase();
        const filtered = query
            ? characters.filter((c) => c.name.toLowerCase().includes(query))
            : characters;

        return interaction.respond(
            filtered.slice(0, 25).map((c) => ({ name: c.name, value: c.name }))
        );
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private requireGuild(interaction: ChatInputCommandInteraction): string {
        if (!interaction.guildId) {
            throw new UserError({ identifier: 'This command can only be used in a server.' });
        }
        return interaction.guildId;
    }

    private requireOwner(interaction: ChatInputCommandInteraction) {
        const owners: string[] = (process.env.CLIENT_OWNERS ?? '').split(' ').filter(Boolean);
        if (!owners.includes(interaction.user.id)) {
            throw new UserError({ identifier: 'Only the bot owner can use this command.' });
        }
    }

    private async getSheetConfig(guildId: string): Promise<{ schema: InternalSheetSchema; sheetName: string }> {
        const dbConfig = await container.database.pathfinderSheetConfig.findFirst({
            where: { guildId },
            orderBy: { version: 'desc' },
        }) as PathfinderSheetConfig | null;

        if (dbConfig) {
            return {
                schema: dbConfig.schema as unknown as InternalSheetSchema,
                sheetName: dbConfig.sheetName,
            };
        }

        return { schema: defaultSheetConfig.schema, sheetName: defaultSheetConfig.sheetName };
    }

    private async performRegistration(
        interaction: ChatInputCommandInteraction,
        guildId: string,
        ownerId: string,
        sheetUrl: string,
        name: string,
    ): Promise<void> {
        const { sheetName } = await this.getSheetConfig(guildId);
        const serviceEmail = env.GOOGLE_ACCOUNT_EMAIL ?? 'the service account';

        const validationError = await validateSheetAccess(sheetUrl, sheetName, serviceEmail);
        if (validationError) {
            throw new UserError({ identifier: validationError.message });
        }

        await this.manager.register(guildId, ownerId, name, sheetUrl);
        const shortUrl = sheetUrl.length > 60 ? `${sheetUrl.slice(0, 57)}…` : sheetUrl;
        await interaction.reply({
            content: `✅ Character **${name}** registered.\n> ${shortUrl}`,
            ephemeral: true,
        });
    }

    // -------------------------------------------------------------------------
    // /character register
    // -------------------------------------------------------------------------

    public async subcommandRegister(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        const sheetUrl = interaction.options.getString('sheet_url', true).trim();
        const name = interaction.options.getString('name', true).trim();
        await this.performRegistration(interaction, guildId, interaction.user.id, sheetUrl, name);
    }

    // -------------------------------------------------------------------------
    // /character unregister
    // -------------------------------------------------------------------------

    public async subcommandUnregister(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        const name = interaction.options.getString('name', true).trim();

        const removed = await this.manager.unregister(guildId, interaction.user.id, name);
        if (!removed) {
            throw new UserError({ identifier: `No character named \`${name}\` found in your registry for this server.` });
        }

        await interaction.reply({ content: `🗑️ Character **${name}** removed.` });
    }

    // -------------------------------------------------------------------------
    // /character list
    // -------------------------------------------------------------------------

    public async subcommandList(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        const characters = await this.manager.listCharacters(guildId, interaction.user.id);

        if (characters.length === 0) {
            await interaction.reply({
                content: 'You have no characters registered in this server. Use `/character register` to add one.',
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Your Characters')
            .setColor(0x5865f2)
            .setDescription(
                characters.map((c) => {
                    const active = c.isActive ? ' ⭐' : '';
                    const used = c.lastUsedAt
                        ? `Last used <t:${Math.floor(c.lastUsedAt.getTime() / 1000)}:R>`
                        : 'Never used';
                    const shortUrl = c.sheetUrl.length > 50 ? `${c.sheetUrl.slice(0, 47)}…` : c.sheetUrl;
                    return `**${c.name}**${active}\n${shortUrl}\n${used}`;
                }).join('\n\n')
            );

        await interaction.reply({ embeds: [embed] });
    }

    // -------------------------------------------------------------------------
    // /character equip
    // -------------------------------------------------------------------------

    public async subcommandEquip(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        const name = interaction.options.getString('name', true).trim();

        const activated = await this.manager.activate(guildId, interaction.user.id, name);
        if (!activated) {
            throw new UserError({ identifier: `No character named \`${name}\` found in your registry for this server.` });
        }

        // Touch lastUsedAt so this character also wins the getLastUsed() fallback.
        await this.manager.touchLastUsed(activated.id);

        await interaction.reply({
            content: `🎲 **${name}** is now your active character for rolls.`,
            ephemeral: true,
        });
    }

    // -------------------------------------------------------------------------
    // /character unequip
    // -------------------------------------------------------------------------

    public async subcommandUnequip(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        await this.manager.deactivate(guildId, interaction.user.id);
        await interaction.reply({
            content: '🔕 Active character cleared. Use `/character use` to select one again.',
            ephemeral: true,
        });
    }

    // -------------------------------------------------------------------------
    // /character info
    // -------------------------------------------------------------------------

    public async subcommandInfo(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        await interaction.deferReply();

        try {
            const nameArg = interaction.options.getString('name')?.trim() ?? null;
            const character = nameArg
                ? await this.manager.getByNameAny(guildId, nameArg)
                : await this.manager.getActive(guildId, interaction.user.id);

            if (!character) {
                await interaction.editReply({
                    content: nameArg
                        ? `No character named \`${nameArg}\` found in the server registry.`
                        : 'No active character set. Use `/character use` to select one.',
                });
                return;
            }

            const { schema, sheetName } = await this.getSheetConfig(guildId);
            const spreadsheetId = extractSheetId(character.sheetUrl);
            if (!spreadsheetId) {
                await interaction.editReply({ content: 'The character sheet URL is invalid. Please re-register the character.' });
                return;
            }

            // Collect all named ranges.
            const namedRangeMap = await resolveNamedRanges(spreadsheetId);

            // Build the cell list for the single batchGet call.
            const skillCells = Object.values(schema.skills);
            const saveCells = Object.values(schema.saves);
            const defenseCells = Object.values(schema.defenses);
            const offenseNameCells = schema.offenses.map((o) => o.name);
            const offenseATKCells  = schema.offenses.map((o) => o.attack);
            const offenseDMGCells  = schema.offenses.map((o) => o.damage);
            const offenseTypeCells = schema.offenses.map((o) => o.type);
            const offenseCritCells = schema.offenses.map((o) => o.crit);

            // Resolve named ranges to cell addresses. For visuals we prefer the
            // ability "score" cells which are commonly stored one column left
            // of the modifier cell; if a named range resolves to an A1 cell
            // (e.g. "G9") we'll compute the left cell ("F9") for display.
            const resolvedAbilityCells: string[] = [];
            const abilityKeys = Object.keys(schema.abilities);
            const shiftCellLeft = (cellOrName: string) => {
                const cell = (namedRangeMap[cellOrName] ?? cellOrName).toString();
                const m = cell.match(/^([A-Za-z]+)(\d+)$/);
                if (!m) return cellOrName; // not an A1 address — fall back to original
                const col = m[1].toUpperCase();
                const row = m[2];
                // Convert column letters to number
                let n = 0;
                for (let i = 0; i < col.length; i++) {
                    n = n * 26 + (col.charCodeAt(i) - 64);
                }
                if (n <= 1) return `${col}${row}`; // can't shift left of A
                n -= 1;
                // Convert back to letters
                let left = '';
                while (n > 0) {
                    const rem = (n - 1) % 26;
                    left = String.fromCharCode(65 + rem) + left;
                    n = Math.floor((n - 1) / 26);
                }
                return `${left}${row}`;
            };

            const resolvedModifierCells: string[] = [];
            for (const key of abilityKeys) {
                const entry: any = (schema.abilities as any)[key];
                // Score cell (visual): prefer explicit `score` entry, else infer
                if (typeof entry === 'string') {
                    // legacy string -> modifier named range or A1; infer score one column left
                    resolvedAbilityCells.push(shiftCellLeft(entry));
                    resolvedModifierCells.push(namedRangeMap[entry] ?? entry);
                } else if (entry && typeof entry === 'object') {
                    if (entry.score) {
                        resolvedAbilityCells.push(namedRangeMap[entry.score] ?? entry.score);
                    } else if (entry.modifier) {
                        resolvedAbilityCells.push(shiftCellLeft(entry.modifier));
                    } else {
                        resolvedAbilityCells.push('—');
                    }
                    if (entry.modifier) {
                        resolvedModifierCells.push(namedRangeMap[entry.modifier] ?? entry.modifier);
                    } else {
                        resolvedModifierCells.push('—');
                    }
                } else {
                    resolvedAbilityCells.push('—');
                    resolvedModifierCells.push('—');
                }
            }
            const babCell = namedRangeMap[schema.totals.bab] ?? schema.totals.bab;
            const levelCell = namedRangeMap[schema.totals.level] ?? schema.totals.level;

            const allCells = [
                schema.name,
                levelCell,
                schema.health,
                ...resolvedModifierCells,
                ...resolvedAbilityCells,
                ...saveCells,
                schema.cmb,
                babCell,
                schema.initiative,
                ...defenseCells,
                ...skillCells,
                ...offenseNameCells,
                ...offenseATKCells,
                ...offenseDMGCells,
                ...offenseTypeCells,
                ...offenseCritCells,
            ];

            const values = await batchGetValues(spreadsheetId, sheetName, allCells);

            const v = (cell: string) => values[cell] ?? '—';

            // Build embed.
            const embed = new EmbedBuilder()
                .setTitle(v(schema.name) || character.name)
                .setURL(character.sheetUrl)
                .setColor(0x8b4513)
                .setFooter({ text: `Fetched at ${new Date().toUTCString()} · ${character.name}` });

            // Level, HP, Init
            embed.addFields([
                { name: 'Level', value: v(levelCell),          inline: true },
                { name: 'HP',   value: v(schema.health),       inline: true },
                { name: 'Init', value: v(schema.initiative),   inline: true },
            ]);

            // Ability scores — STR / DEX / CON / INT / WIS / CHA
            embed.addFields([{
                name: 'Abilities',
                value: abilityKeys.map((key, i) => {
                    const label = key.charAt(0).toUpperCase() + key.slice(1, 3).toUpperCase();
                    const scoreRaw = v(resolvedAbilityCells[i]);
                    const modRaw = v((resolvedModifierCells && resolvedModifierCells[i]) || '—');

                    const scoreStr = String(scoreRaw ?? '').trim();
                    const modStrRaw = String(modRaw ?? '').trim();

                    // Prefer explicit modifier value when available and signed.
                    if (/^[+-]\d+$/.test(modStrRaw)) {
                        if (scoreStr && scoreStr !== '—') {
                            const scoreNum = parseInt(scoreStr.replace(/[^0-9-]/g, ''), 10);
                            if (!Number.isNaN(scoreNum)) return `${label}: ${scoreNum} (${modStrRaw})`;
                        }
                        return `${label}: ${modStrRaw}`;
                    }

                    // If modifier cell contains an unsigned number, treat it as the modifier.
                    const modNum = parseInt(modStrRaw.replace(/[^0-9-]/g, ''), 10);
                    if (!Number.isNaN(modNum) && modStrRaw !== '') {
                        const signed = modNum >= 0 ? `+${modNum}` : `${modNum}`;
                        if (scoreStr && scoreStr !== '—') {
                            const scoreNum = parseInt(scoreStr.replace(/[^0-9-]/g, ''), 10);
                            if (!Number.isNaN(scoreNum)) return `${label}: ${scoreNum} (${signed})`;
                        }
                        return `${label}: ${signed}`;
                    }

                    // Fallback: if we have a score, compute the modifier from it.
                    const num = parseInt(scoreStr.replace(/[^0-9-]/g, ''), 10);
                    if (!Number.isNaN(num)) {
                        const computed = Math.floor((num - 10) / 2);
                        const computedStr = computed >= 0 ? `+${computed}` : `${computed}`;
                        return `${label}: ${num} (${computedStr})`;
                    }

                    // Final fallback: show whatever raw value we have for score or modifier.
                    if (scoreStr && scoreStr !== '—') return `${label}: ${scoreStr}`;
                    if (modStrRaw && modStrRaw !== '—') return `${label}: ${modStrRaw}`;
                    return `${label}: —`;
                }).join('\n'),
                inline: false,
            }]);

            // Saves
            embed.addFields([{
                name: 'Saves',
                value: `Fort: ${v(schema.saves['fortitude'])} | Ref: ${v(schema.saves['reflex'])} | Will: ${v(schema.saves['will'])}`,
                inline: false,
            }]);

            // BAB / CMB
            embed.addFields([{
                name: 'Combat',
                value: `BAB: ${v(babCell)} | CMB: ${v(schema.cmb)}`,
                inline: false,
            }]);

            // Offenses — one field, each attack on its own line block
            const offenseLines: string[] = [];
            for (const o of schema.offenses) {
                const oName = values[o.name];
                if (!oName || oName.trim() === '') continue;
                offenseLines.push(
                    `**${oName}**\nAtk: ${v(o.attack)} | Dmg: ${(`${v(o.damage)} ${v(o.type)}`).trim()} | Crit: ${v(o.crit)}`
                );
            }
            if (offenseLines.length > 0) {
                embed.addFields([{
                    name: '⚔️ Offenses',
                    value: offenseLines.join('\n\n'),
                    inline: false,
                }]);
            }

            // Defenses — one field
            const defKeys = Object.keys(schema.defenses);
            embed.addFields([{
                name: '🛡️ Defenses',
                value: defKeys.map((k) => `${k}: ${v(schema.defenses[k])}`).join(' | ') || '—',
                inline: false,
            }]);

            // Skills — one field, only non-empty, truncated to Discord's 1024-char limit
            const skillEntries = Object.entries(schema.skills)
                .map(([skillName, cell]) => ({ name: skillName, value: values[cell] }))
                .filter((s) => s.value != null && s.value !== '');
            if (skillEntries.length > 0) {
                let skillValue = skillEntries.map((s) => `${s.name}: ${s.value}`).join('\n');
                if (skillValue.length > 1024) skillValue = skillValue.slice(0, 1021) + '…';
                embed.addFields([{ name: '📚 Skills', value: skillValue, inline: false }]);
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            this.container.logger.error(error);
            const content = error instanceof UserError
                ? error.identifier
                : 'Failed to fetch character sheet. Please try again.';
            try {
                await interaction.editReply({ content });
            } catch {
                // Interaction may have expired.
            }
        }
    }

    // -------------------------------------------------------------------------
    // /character admin list-all
    // -------------------------------------------------------------------------

    public async subcommandAdminListAll(interaction: ChatInputCommandInteraction) {
        this.requireOwner(interaction);
        const guildId = this.requireGuild(interaction);

        const all = await this.manager.listAll(guildId);
        if (all.length === 0) {
            await interaction.reply({ content: 'No characters registered in this guild.', ephemeral: true });
            return;
        }

        // Group by ownerId.
        const grouped = new Map<string, string[]>();
        for (const c of all) {
            const arr = grouped.get(c.ownerId) ?? [];
            arr.push(`**${c.name}**${c.isActive ? ' ⭐' : ''}`);
            grouped.set(c.ownerId, arr);
        }

        const lines: string[] = [];
        for (const [ownerId, names] of grouped) {
            lines.push(`<@${ownerId}>:\n${names.map((name) => `- ${name}`).join('\n')}`);
        }

        const embed = new EmbedBuilder()
            .setTitle('All Registered Characters')
            .setColor('Purple')
            .addFields(lines.map((line) => ({ name: '\u200b', value: line, inline: false })));

        await interaction.reply({ embeds: [embed] });
    }

    // -------------------------------------------------------------------------
    // /character admin register
    // -------------------------------------------------------------------------

    public async subcommandAdminRegister(interaction: ChatInputCommandInteraction) {
        this.requireOwner(interaction);
        const guildId = this.requireGuild(interaction);
        const targetUser = interaction.options.getUser('user', true);
        const sheetUrl = interaction.options.getString('sheet_url', true).trim();
        const name = interaction.options.getString('name', true).trim();
        await this.performRegistration(interaction, guildId, targetUser.id, sheetUrl, name);
    }

    // -------------------------------------------------------------------------
    // /character admin unregister
    // -------------------------------------------------------------------------

    public async subcommandAdminUnregister(interaction: ChatInputCommandInteraction) {
        this.requireOwner(interaction);
        const guildId = this.requireGuild(interaction);
        const targetUser = interaction.options.getUser('user', true);
        const name = interaction.options.getString('name', true).trim();

        const removed = await this.manager.unregister(guildId, targetUser.id, name);
        if (!removed) {
            throw new UserError({
                identifier: `No character named \`${name}\` found for <@${targetUser.id}> in this server.`,
            });
        }

        await interaction.reply({
            content: `🗑️ Removed **${name}** from <@${targetUser.id}>'s registry.`,
            ephemeral: true,
        });
    }
}
