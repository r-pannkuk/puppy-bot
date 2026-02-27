/**
 * @file CharacterCommand.ts
 * @description The `/character` command group for managing per-guild Pathfinder
 * character sheet registrations.
 *
 * Subcommands (flat children of /character):
 *   register  <sheet_url> <name>  — register or re-register a character
 *   unregister <name>             — remove a character
 *   list                          — list all characters for the invoker
 *   activate  <name>              — set isActive flag
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
        { name: 'use',        chatInputRun: 'subcommandUse' },
        { name: 'activate',   chatInputRun: 'subcommandActivate' },
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

                // /character use
                .addSubcommand((sub) =>
                    sub
                        .setName('use')
                        .setDescription('Set your active character for rolls (token substitution and embed display).')
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Character name to use for rolls.').setRequired(true).setAutocomplete(true)
                        )
                )

                // /character activate
                .addSubcommand((sub) =>
                    sub
                        .setName('activate')
                        .setDescription('Set a character as active.')
                        .addStringOption((o) =>
                            o.setName('name').setDescription('Character name to activate.').setRequired(true).setAutocomplete(true)
                        )
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
        let ownerId: string;
        if (subcommandGroup === 'admin' && subcommand === 'unregister') {
            // At autocomplete time, the user option value is available as a raw string ID.
            const targetUserId = interaction.options.get('user')?.value as string | undefined;
            ownerId = targetUserId ?? interaction.user.id;
        } else {
            ownerId = interaction.user.id;
        }

        const characters = await this.manager.listCharacters(guildId, ownerId);
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

        await interaction.reply({ content: `🗑️ Character **${name}** removed.`, ephemeral: true });
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
                ephemeral: true,
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

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // -------------------------------------------------------------------------
    // /character use
    // -------------------------------------------------------------------------

    public async subcommandUse(interaction: ChatInputCommandInteraction) {
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
    // /character activate
    // -------------------------------------------------------------------------

    public async subcommandActivate(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        const name = interaction.options.getString('name', true).trim();

        const activated = await this.manager.activate(guildId, interaction.user.id, name);
        if (!activated) {
            throw new UserError({ identifier: `No character named \`${name}\` found in your registry for this server.` });
        }

        await interaction.reply({ content: `⭐ **${name}** is now your active character.`, ephemeral: true });
    }

    // -------------------------------------------------------------------------
    // /character info
    // -------------------------------------------------------------------------

    public async subcommandInfo(interaction: ChatInputCommandInteraction) {
        const guildId = this.requireGuild(interaction);
        await interaction.deferReply({ ephemeral: true });

        const nameArg = interaction.options.getString('name')?.trim() ?? null;
        const character = nameArg
            ? await this.manager.getByName(guildId, interaction.user.id, nameArg)
            : await this.manager.getActive(guildId, interaction.user.id);

        if (!character) {
            throw new UserError({
                identifier: nameArg
                    ? `No character named \`${nameArg}\` found in your registry for this server.`
                    : 'No active character set. Use `/character activate` or `/character register` first.',
            });
        }

        const { schema, sheetName } = await this.getSheetConfig(guildId);
        const spreadsheetId = extractSheetId(character.sheetUrl);
        if (!spreadsheetId) {
            throw new UserError({ identifier: 'The character sheet URL is invalid. Please re-register the character.' });
        }

        // Collect all named ranges.
        const namedRangeMap = await resolveNamedRanges(spreadsheetId);

        // Build the cell list for the single batchGet call.
        const abilityRanges = Object.values(schema.abilities);
        const skillCells = Object.values(schema.skills);
        const saveCells = Object.values(schema.saves);
        const defenseCells = Object.values(schema.defenses);
        const offenseNameCells = schema.offenses.map((o) => o.name);
        const offenseATKCells  = schema.offenses.map((o) => o.attack);
        const offenseDMGCells  = schema.offenses.map((o) => o.damage);
        const offenseTypeCells = schema.offenses.map((o) => o.type);
        const offenseCritCells = schema.offenses.map((o) => o.crit);

        // Resolve named ranges to cell addresses.
        const resolvedAbilityCells: string[] = [];
        const abilityKeys = Object.keys(schema.abilities);
        for (const rangeName of abilityRanges) {
            resolvedAbilityCells.push(namedRangeMap[rangeName] ?? rangeName);
        }
        const babCell = namedRangeMap[schema.totals.bab] ?? schema.totals.bab;
        const levelCell = namedRangeMap[schema.totals.level] ?? schema.totals.level;

        const allCells = [
            schema.name,
            levelCell,
            schema.health,
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
            .setTitle(v(schema.name))
            .setColor(0x8b4513)
            .setFooter({ text: `Fetched at ${new Date().toUTCString()} · ${character.name}` });

        // Identity
        embed.addFields([
            { name: 'Level', value: v(levelCell), inline: true },
            { name: 'HP', value: v(schema.health), inline: true },
        ]);

        // Ability scores
        const abilityFields = abilityKeys.map((key, i) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1, 3).toUpperCase(),
            value: v(resolvedAbilityCells[i]),
            inline: true,
        }));
        embed.addFields(abilityFields);

        // Saves
        embed.addFields([
            { name: 'Fort', value: v(schema.saves['fortitude']), inline: true },
            { name: 'Ref',  value: v(schema.saves['reflex']),    inline: true },
            { name: 'Will', value: v(schema.saves['will']),       inline: true },
        ]);

        // Offenses
        for (let i = 0; i < schema.offenses.length; i++) {
            const o = schema.offenses[i];
            const oName = values[o.name];
            if (!oName || oName.trim() === '') continue;
            embed.addFields([{
                name: `⚔️ ${oName}`,
                value: [
                    `Atk: ${v(o.attack)}`,
                    `Dmg: ${v(o.damage)} ${v(o.type)}`.trim(),
                    `Crit: ${v(o.crit)}`,
                ].join(' | '),
                inline: false,
            }]);
        }

        // Defenses
        const defKeys = Object.keys(schema.defenses);
        embed.addFields(
            defKeys.map((k) => ({ name: k, value: v(schema.defenses[k]), inline: true }))
        );

        // Combat
        embed.addFields([
            { name: 'BAB',  value: v(babCell),          inline: true },
            { name: 'CMB',  value: v(schema.cmb),       inline: true },
            { name: 'Init', value: v(schema.initiative), inline: true },
        ]);

        // Skills (only non-empty)
        const skillFields = Object.entries(schema.skills)
            .map(([skillName, cell]) => ({ name: skillName, value: values[cell] ?? null }))
            .filter((s) => s.value !== null && s.value !== '');
        if (skillFields.length > 0) {
            embed.addFields(
                skillFields.map((s) => ({ name: s.name, value: s.value!, inline: true }))
            );
        }

        await interaction.editReply({ embeds: [embed] });
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
            lines.push(`<@${ownerId}>: ${names.join(', ')}`);
        }

        const embed = new EmbedBuilder()
            .setTitle('All registered characters')
            .setColor(0xff0000)
            .setDescription(lines.join('\n'));

        await interaction.reply({ embeds: [embed], ephemeral: true });
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
