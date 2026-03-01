/**
 * Unit tests for CharacterCommand chatInputRun routing to subcommandEquip.
 */
import { describe, it, expect, vi } from 'vitest';
import { CharacterCommand } from '../../src/commands/pathfinder/CharacterCommand';

// Instantiate command without running Sapphire constructor chain.
function makeCmd<T>(Ctor: new (...args: any[]) => T): T {
    return Object.create((Ctor as any).prototype) as T;
}

const GUILD_ID = 'guild-001';
const user = { id: 'user-001' } as any;

function makeInteraction() {
    return {
        guildId: GUILD_ID,
        user,
        reply: vi.fn().mockResolvedValue(undefined),
        editReply: vi.fn().mockResolvedValue(undefined),
        deferReply: vi.fn().mockResolvedValue(undefined),
        options: {
            getSubcommand: vi.fn(() => 'equip'),
            getSubcommandGroup: vi.fn(() => null),
            getString: vi.fn((name: string) => (name === 'name' ? 'MyCharacter' : null)),
            get: vi.fn((name: string) => (name === 'name' ? { value: 'MyCharacter' } : null)),
        },
    } as any;
}

describe('CharacterCommand – chatInputRun routing', () => {
    it('subcommandEquip activates character and replies', async () => {
        const cmd = makeCmd(CharacterCommand);

        // Stub manager methods used by the handler.
        (cmd as any).manager = {
            activate: vi.fn().mockResolvedValue({ id: 'char-1' }),
            touchLastUsed: vi.fn().mockResolvedValue(undefined),
        };

        const ix = makeInteraction();

        await (cmd as any).subcommandEquip(ix);

        expect((cmd as any).manager.activate).toHaveBeenCalledWith(GUILD_ID, user.id, 'MyCharacter');
        expect(ix.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('MyCharacter') }));
    });
});
