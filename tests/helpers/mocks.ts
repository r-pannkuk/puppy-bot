/**
 * Lightweight test helpers and mock factories.
 *
 * Avoids a full Discord.js client while still providing objects that satisfy
 * the type signatures used by the managers under test.
 */

import { Collection } from 'discord.js';
import type { BattleTrapDamageFormulaType } from '@prisma/client';
import type { BattleSystem } from '../../src/lib/structures/managers/BattleSystem';

// ── Guild stub ────────────────────────────────────────────────────────────────

/** Minimal Guild-shaped object accepted by manager constructors. */
export function makeGuild(id: string = 'test-guild-000000000') {
    return { id } as any;
}

// ── BattleSystem config stub ──────────────────────────────────────────────────

export function makeBattleConfig(overrides: Partial<BattleSystem.Config.Instance> = {}): BattleSystem.Config.Instance {
    return {
        id: 'cfg-id',
        guildId: 'test-guild',
        version: '1.0.0',
        levelConfigs: new Collection([
            [1, { levelNum: 1, reqExperience: 0, maxTraps: 3, maxHealth: 100, maxEnergy: 100, baseHealthRegen: 1, baseEnergyRegen: 1 }],
            [2, { levelNum: 2, reqExperience: 100, maxTraps: 5, maxHealth: 200, maxEnergy: 200, baseHealthRegen: 1.5, baseEnergyRegen: 1.5 }],
        ]),
        abilityConfigs: new Collection(),
        trapConfig: {
            trapExplodeIconSourceURL: '',
            trapArmedIconSourceURL: '',
            trapSelfIconSourceURL: '',
            trapChannelId: null,
            removeTrapExperienceScalar: 10,
            timeSecsToDeleteTrapMessage: 10,
            damage: {
                formulaType: 'Base' as BattleTrapDamageFormulaType,
                wordScalar: 2,
                numCharacterScalar: 1,
                timeIntervals: [
                    { intervalSecs: 60, damageScalar: 0.1 },
                    { intervalSecs: 300, damageScalar: 0.2 },
                ],
                exponentialScalar: 0.5,
                linearScalar: 0.01,
            },
        },
        ...overrides,
    } as any;
}

/** Creates a minimal BattleSystem.Trap.Instance for formula tests. */
export function makeTrap(phrase: string, createdAt: Date = new Date(Date.now() - 60_000)): BattleSystem.Trap.Instance {
    return {
        id: 'trap-id',
        phrase,
        createdAt,
        state: 'Armed',
        battleUserId: 'battle-user-id',
        records: new Collection(),
        obscuredPhrase: phrase.replaceAll(/\S/g, '⬜'),
        getBattleUser: () => undefined as any,
        damage: () => 0,
        duration: () => Date.now() - createdAt.getTime(),
        experience: () => 0,
    } as any;
}

// ── CustomCommand stub ────────────────────────────────────────────────────────

export function makeCustomCommand(overrides: Partial<{ id: string; name: string; aliases: string[]; ownerId: string; content: string }> = {}) {
    return {
        id: overrides.id ?? 'cmd-id-001',
        guildId: 'test-guild-000000000',
        name: overrides.name ?? 'testcmd',
        aliases: overrides.aliases ?? ['tc'],
        ownerId: overrides.ownerId ?? 'owner-000',
        content: overrides.content ?? 'hello!',
        createdAt: new Date(),
        lastUsedAt: null,
        useCount: 0,
    };
}
