/**
 * @file PathfinderManager.ts
 * @description DB CRUD helpers for PathfinderCharacterConfig.
 *
 * All methods are guild-scoped — characters registered in one guild are never
 * visible in another. Accessed via `container.database`.
 *
 * Key mutations:
 * - `register`     — upsert by name; auto-sets isActive on first character.
 * - `unregister`   — deletes a character; auto-promotes successor if it was active.
 * - `activate`     — sets isActive=true on the named character, clears all others.
 * - `deactivate`   — clears isActive from all the user's characters (for /character unequip).
 * - `touchLastUsed` — updates lastUsedAt after a successful roll.
 */
import type { PathfinderCharacterConfig } from '@prisma/client';
import { container } from '@sapphire/framework';

export class PathfinderManager {
    private get db() {
        return container.database;
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    /** Returns all characters owned by a user in a guild, ordered by lastUsedAt DESC. */
    public async listCharacters(
        guildId: string,
        ownerId: string,
    ): Promise<PathfinderCharacterConfig[]> {
        return this.db.pathfinderCharacterConfig.findMany({
            where: { guildId, ownerId },
            orderBy: [
                { lastUsedAt: 'desc' },
                { registeredAt: 'desc' },
            ],
        });
    }

    /** Returns all characters in a guild (owner-admin use). */
    public async listAll(guildId: string): Promise<PathfinderCharacterConfig[]> {
        return this.db.pathfinderCharacterConfig.findMany({
            where: { guildId },
            orderBy: [{ ownerId: 'asc' }, { name: 'asc' }],
        });
    }

    /** Returns a single character by name for a user in a guild. */
    public async getByName(
        guildId: string,
        ownerId: string,
        name: string,
    ): Promise<PathfinderCharacterConfig | null> {
        return this.db.pathfinderCharacterConfig.findUnique({
            where: { guildId_ownerId_name: { guildId, ownerId, name } },
        });
    }

    /** Returns a single character by name anywhere in the guild (any owner).
     * If multiple characters share the name, returns the most recently registered. */
    public async getByNameAny(
        guildId: string,
        name: string,
    ): Promise<PathfinderCharacterConfig | null> {
        return this.db.pathfinderCharacterConfig.findFirst({
            where: { guildId, name },
            orderBy: { registeredAt: 'desc' },
        });
    }

    /** Returns the most recently used character for a user in a guild (null if none). */
    public async getLastUsed(
        guildId: string,
        ownerId: string,
    ): Promise<PathfinderCharacterConfig | null> {
        const results = await this.db.pathfinderCharacterConfig.findMany({
            where: { guildId, ownerId },
            orderBy: [
                { lastUsedAt: 'desc' },
                { registeredAt: 'desc' },
            ],
            take: 1,
        });
        return results[0] ?? null;
    }

    /** Returns the active character for a user in a guild (null if none). */
    public async getActive(
        guildId: string,
        ownerId: string,
    ): Promise<PathfinderCharacterConfig | null> {
        return this.db.pathfinderCharacterConfig.findFirst({
            where: { guildId, ownerId, isActive: true },
        });
    }

    // -------------------------------------------------------------------------
    // Mutations
    // -------------------------------------------------------------------------

    /**
     * Registers a character, or updates its sheetUrl if it already exists.
     * If this is the user's first character in the guild, sets isActive = true.
     */
    public async register(
        guildId: string,
        ownerId: string,
        name: string,
        sheetUrl: string,
    ): Promise<PathfinderCharacterConfig> {
        const existing = await this.getByName(guildId, ownerId, name);

        if (existing) {
            return this.db.pathfinderCharacterConfig.update({
                where: { id: existing.id },
                data: { sheetUrl },
            });
        }

        // Determine if this is the first character for this user in this guild.
        const count = await this.db.pathfinderCharacterConfig.count({
            where: { guildId, ownerId },
        });

        return this.db.pathfinderCharacterConfig.create({
            data: {
                guildId,
                ownerId,
                name,
                sheetUrl,
                isActive: count === 0,
            },
        });
    }

    /**
     * Removes a character. If the removed character was `isActive`, promotes
     * the most recently registered remaining character to active.
     */
    public async unregister(
        guildId: string,
        ownerId: string,
        name: string,
    ): Promise<PathfinderCharacterConfig | null> {
        const record = await this.getByName(guildId, ownerId, name);
        if (!record) return null;

        await this.db.pathfinderCharacterConfig.delete({ where: { id: record.id } });

        if (record.isActive) {
            const remaining = await this.db.pathfinderCharacterConfig.findFirst({
                where: { guildId, ownerId },
                orderBy: { registeredAt: 'desc' },
            });
            if (remaining) {
                await this.db.pathfinderCharacterConfig.update({
                    where: { id: remaining.id },
                    data: { isActive: true },
                });
            }
        }

        return record;
    }

    /**
     * Sets the named character as `isActive`, clearing active from all others
     * owned by the same user in the same guild.
     */
    public async activate(
        guildId: string,
        ownerId: string,
        name: string,
    ): Promise<PathfinderCharacterConfig | null> {
        const record = await this.getByName(guildId, ownerId, name);
        if (!record) return null;

        // Clear existing active flag.
        await this.db.pathfinderCharacterConfig.updateMany({
            where: { guildId, ownerId, isActive: true },
            data: { isActive: false },
        });

        return this.db.pathfinderCharacterConfig.update({
            where: { id: record.id },
            data: { isActive: true },
        });
    }

    /**
     * Clears `isActive` from all characters owned by the user in the guild.
     * After this call the user has no active character until they run `/character use`.
     */
    public async deactivate(guildId: string, ownerId: string): Promise<void> {
        await this.db.pathfinderCharacterConfig.updateMany({
            where: { guildId, ownerId, isActive: true },
            data: { isActive: false },
        });
    }

    /**
     * Updates `lastUsedAt` to now for the given character record.
     * Called by `/roll` after a successful character-sheet roll.
     */
    public async touchLastUsed(id: string): Promise<void> {
        await this.db.pathfinderCharacterConfig.update({
            where: { id },
            data: { lastUsedAt: new Date() },
        });
    }
}
