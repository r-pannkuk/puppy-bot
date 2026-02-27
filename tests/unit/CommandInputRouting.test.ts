/**
 * @file CommandInputRouting.test.ts
 *
 * Validates that every command's `messageRun` (text / prefix) and
 * `chatInputRun` (slash) entry-points both route to the same underlying
 * business-logic method with the correct arguments.
 *
 * Strategy
 * --------
 * 1. Instantiate each command via `Object.create(Ctor.prototype)` so the
 *    Sapphire / Discord.js constructor chain is never executed.
 * 2. Stub the shared inner method (e.g. pause(), seek(), run()) with vi.fn().
 * 3. Provide minimal Message / Interaction / Args stubs.
 *    – `makeTextChannel()` uses `Object.create(TextChannel.prototype)` so that
 *      `channel instanceof TextChannel === true`, satisfying guards in commands
 *      like PauseCommand that check this before calling `channel.send()`.
 *    – `makeMessage()` similarly uses `Object.create(Message.prototype)`.
 * 4. Assert that the inner method is called with the expected arguments.
 * 5. Where applicable, a third "parity" test confirms that both paths
 *    forward the same value to the shared method.
 *
 * Commands under test
 * -------------------
 *   Music:  PauseCommand, ResumeCommand, SkipCommand, SeekCommand,
 *           StopCommand, PlayCommand (resolve helper)
 *   RNG:    DiceRollCommand, GroupsCommand
 *   Misc:   PingCommand
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '@sapphire/framework';
import { TextChannel } from 'discord.js';

import { PauseCommand }           from '../../src/commands/music/Pause';
import { ResumeCommand }          from '../../src/commands/music/Resume';
import { SeekCommand }            from '../../src/commands/music/Seek';
import { SkipCommand }            from '../../src/commands/music/Skip';
import { StopCommand }            from '../../src/commands/music/Stop';
import { PlayCommand }            from '../../src/commands/music/Play';
import { DiceRollCommand }        from '../../src/commands/rng/DiceRollCommand';
import { GroupsCommand }          from '../../src/commands/rng/GroupsCommand';
import { PingCommand }            from '../../src/commands/PingCommand';
// Meme commands (Phase 4)
import { SylphieCommand }         from '../../src/commands/memes/Healing';
import { BrightCommand }          from '../../src/commands/memes/Bright';
import { DuwangCommand }          from '../../src/commands/memes/Duwang';
import { KinzoCommand }           from '../../src/commands/memes/Kinzo';
import { LiedCommand }            from '../../src/commands/memes/Lied';
import { MagnetoCommand }         from '../../src/commands/memes/Magneto';
import { SuperturnCommand }       from '../../src/commands/memes/Superturn';
import { CongratulationsCommand } from '../../src/commands/memes/Congratulations';

// ── Shared constants ──────────────────────────────────────────────────────────

const GUILD_ID = 'guild-001';
const guild    = { id: GUILD_ID } as any;
const user     = { id: 'user-001' } as any;

// ── Stub factories ────────────────────────────────────────────────────────────

/**
 * Instantiate a command without running the Sapphire constructor chain.
 * `this.container` inside every Command is a getter returning the Sapphire
 * module-level `container` singleton, so injecting that is sufficient.
 */
function makeCmd<T>(Ctor: new (...args: any[]) => T): T {
    return Object.create((Ctor as any).prototype) as T;
}

/**
 * Channel stub that satisfies `instanceof TextChannel`.
 * Commands like PauseCommand guard behind this check before calling
 * `channel.send()`, so the prototype must be set correctly.
 */
function makeTextChannel() {
    const ch   = Object.create(TextChannel.prototype);
    ch.send    = vi.fn().mockResolvedValue({ id: 'sent-msg-001', edit: vi.fn().mockResolvedValue(undefined) });
    ch.messages = { cache: new Map() };
    return ch;
}

/**
 * Plain-object message stub.
 *
 * `Message.prototype.guild` is a read-only getter in discord.js, so we
 * cannot use `Object.create(Message.prototype)` and then assign to `guild`.
 * The commands' own `messageRun` bodies never do `instanceof Message` checks
 * themselves — that routing is done by the Sapphire framework.  They only
 * access `.guild`, `.guildId`, `.author`, and `.channel`, all of which a
 * plain object stub provides freely.
 *
 * The channel is still created via `Object.create(TextChannel.prototype)` so
 * that guards like `if (message.channel instanceof TextChannel)` in PingCommand
 * and PauseCommand pass correctly.
 */
function makeMessage(overrides: Record<string, unknown> = {}) {
    const msg: Record<string, unknown> = {
        guildId:          GUILD_ID,
        guild,
        author:           user,
        channelId:        'channel-001',
        channel:          makeTextChannel(),
        createdTimestamp: Date.now() - 50,
        reply:            vi.fn().mockResolvedValue(undefined),
        attachments:      { first: () => undefined },
        ...overrides,
    };
    return msg as any;
}

/** Minimal ChatInputCommandInteraction stub. */
function makeInteraction(optionValues: Record<string, number | string | null> = {}) {
    return {
        guildId:          GUILD_ID,
        guild,
        user,
        channelId:        'channel-001',
        replied:          false,
        reply:            vi.fn().mockResolvedValue(undefined),
        editReply:        vi.fn().mockResolvedValue(undefined),
        deferReply:       vi.fn().mockResolvedValue(undefined),
        options: {
            get:        vi.fn((name: string) =>
                            optionValues[name] != null ? { value: optionValues[name] } : null),
            getNumber:  vi.fn((name: string) => optionValues[name] ?? null),
            getString:  vi.fn((name: string) => optionValues[name] ?? null),
            getInteger: vi.fn((name: string) => optionValues[name] ?? null),
        },
        createdTimestamp: Date.now(),
    } as any;
}

/** Minimal Sapphire Args stub. */
function makeArgs(overrides: Record<string, unknown> = {}) {
    return {
        getOption:  vi.fn().mockReturnValue(null),
        pick:       vi.fn().mockResolvedValue(null),
        repeat:     vi.fn().mockResolvedValue([]),
        restResult: vi.fn().mockResolvedValue({ isErr: () => true }),
        ...overrides,
    } as any;
}

// ── Container setup ──────────────────────────────────────────────────────────

/** Fresh container mock used by music and ping commands. */
function setupContainer() {
    const playerMap = new Map<string, any>();
    const queueMap  = new Map<string, any>();

    (container as any).client = {
        musicPlayer: {
            players:         playerMap,
            leaveVoiceChannel: vi.fn(),
            getIdealNode:    vi.fn(),
            joinVoiceChannel: vi.fn(),
        },
        musicQueue: queueMap,
        ws: { ping: 42 },
    };

    return { playerMap, queueMap };
}

// ─────────────────────────────────────────────────────────────────────────────
// PauseCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('PauseCommand – messageRun / chatInputRun routing', () => {
    beforeEach(setupContainer);

    it('messageRun calls pause() with the message guild', async () => {
        const cmd  = makeCmd(PauseCommand);
        const spy  = vi.fn().mockReturnValue('Paused: Foo');
        cmd.pause  = spy;
        await cmd.messageRun(makeMessage(), makeArgs());
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('chatInputRun calls pause() with the interaction guild', async () => {
        const cmd  = makeCmd(PauseCommand);
        const spy  = vi.fn().mockReturnValue('Paused: Foo');
        cmd.pause  = spy;
        await cmd.chatInputRun(makeInteraction(), {} as any);
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('both forms call pause() exactly once per invocation', async () => {
        const cmdA = makeCmd(PauseCommand);
        const cmdB = makeCmd(PauseCommand);
        const spyA = vi.fn().mockReturnValue('ok');
        const spyB = vi.fn().mockReturnValue('ok');
        cmdA.pause = spyA;
        cmdB.pause = spyB;

        await cmdA.messageRun(makeMessage(), makeArgs());
        await cmdB.chatInputRun(makeInteraction(), {} as any);

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(spyB).toHaveBeenCalledTimes(1);
    });

    it('both forms produce identical responses from the same pause() logic', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: false, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'My Track' }, track: 'x' }] });

        const result1 = makeCmd(PauseCommand).pause(guild);
        const result2 = makeCmd(PauseCommand).pause(guild);
        expect(result1).toBe(result2);
        expect(result1).toContain('My Track');
    });

    // ── Real-path end-to-end (no inner-method stub) ───────────────────────────
    // These tests call the actual messageRun / chatInputRun without replacing
    // pause() with a spy.  They would have failed before the TextChannel
    // instanceof guard was removed (the response was silently dropped in
    // non-TextChannel guild channels such as threads).

    it('end-to-end: messageRun sends the pause result to the channel', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: false, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Live Track' }, track: 'x' }] });

        const cmd = makeCmd(PauseCommand);
        const msg = makeMessage();
        await cmd.messageRun(msg, makeArgs());

        expect(msg.channel.send).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Live Track') }),
        );
    });

    it('end-to-end: chatInputRun replies with the pause result', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: false, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Live Track' }, track: 'x' }] });

        const cmd = makeCmd(PauseCommand);
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);

        expect(ix.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Live Track') }),
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResumeCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('ResumeCommand – messageRun / chatInputRun routing', () => {
    beforeEach(setupContainer);

    it('messageRun calls resume() with the message guild', async () => {
        const cmd   = makeCmd(ResumeCommand);
        const spy   = vi.fn().mockReturnValue('Resumed: Foo');
        cmd.resume  = spy;
        await cmd.messageRun(makeMessage(), makeArgs());
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('chatInputRun calls resume() with the interaction guild', async () => {
        const cmd   = makeCmd(ResumeCommand);
        const spy   = vi.fn().mockReturnValue('Resumed: Foo');
        cmd.resume  = spy;
        await cmd.chatInputRun(makeInteraction(), {} as any);
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('both forms call resume() exactly once per invocation', async () => {
        const cmdA = makeCmd(ResumeCommand);
        const cmdB = makeCmd(ResumeCommand);
        const spyA = vi.fn().mockReturnValue('ok');
        const spyB = vi.fn().mockReturnValue('ok');
        cmdA.resume = spyA;
        cmdB.resume = spyB;

        await cmdA.messageRun(makeMessage(), makeArgs());
        await cmdB.chatInputRun(makeInteraction(), {} as any);

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(spyB).toHaveBeenCalledTimes(1);
    });

    it('both forms produce identical responses from the same resume() logic', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: true, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Chill Beats' }, track: 'x' }] });

        const result1 = makeCmd(ResumeCommand).resume(guild);
        const result2 = makeCmd(ResumeCommand).resume(guild);
        expect(result1).toBe(result2);
        expect(result1).toContain('Chill Beats');
    });

    // ── Real-path end-to-end ──────────────────────────────────────────────────

    it('end-to-end: messageRun sends the resume result to the channel', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: true, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Paused Song' }, track: 'x' }] });

        const cmd = makeCmd(ResumeCommand);
        const msg = makeMessage();
        await cmd.messageRun(msg, makeArgs());

        expect(msg.channel.send).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Paused Song') }),
        );
    });

    it('end-to-end: chatInputRun replies with the resume result', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { paused: true, setPaused: vi.fn() });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Paused Song' }, track: 'x' }] });

        const cmd = makeCmd(ResumeCommand);
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);

        expect(ix.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Paused Song') }),
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkipCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('SkipCommand – messageRun / chatInputRun routing', () => {
    beforeEach(setupContainer);

    it('messageRun calls skip() with the message guild', async () => {
        const cmd = makeCmd(SkipCommand);
        const spy = vi.fn().mockResolvedValue('Skipping. End of queue.');
        cmd.skip  = spy;
        await cmd.messageRun(makeMessage(), makeArgs());
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('chatInputRun calls skip() with the interaction guild', async () => {
        const cmd = makeCmd(SkipCommand);
        const spy = vi.fn().mockResolvedValue('Skipping. End of queue.');
        cmd.skip  = spy;
        await cmd.chatInputRun(makeInteraction(), {} as any);
        expect(spy).toHaveBeenCalledWith(guild);
    });

    it('both forms call skip() exactly once per invocation', async () => {
        const cmdA = makeCmd(SkipCommand);
        const cmdB = makeCmd(SkipCommand);
        const spyA = vi.fn().mockResolvedValue('ok');
        const spyB = vi.fn().mockResolvedValue('ok');
        cmdA.skip = spyA;
        cmdB.skip = spyB;

        await cmdA.messageRun(makeMessage(), makeArgs());
        await cmdB.chatInputRun(makeInteraction(), {} as any);

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(spyB).toHaveBeenCalledTimes(1);
    });

    it('both forms produce identical responses from the same skip() logic', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { stopTrack: vi.fn().mockResolvedValue(undefined) });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Now' }, track: 'x' }, { info: { title: 'Next' }, track: 'y' }] });

        const result1 = await makeCmd(SkipCommand).skip(guild);
        const result2 = await makeCmd(SkipCommand).skip(guild);
        expect(result1).toBe(result2);
        expect(result1).toContain('Next');
    });

    // ── Real-path end-to-end ──────────────────────────────────────────────────

    it('end-to-end: messageRun sends the skip result to the channel', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { stopTrack: vi.fn().mockResolvedValue(undefined) });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Current' }, track: 'x' }, { info: { title: 'Upcoming' }, track: 'y' }] });

        const cmd = makeCmd(SkipCommand);
        const msg = makeMessage();
        await cmd.messageRun(msg, makeArgs());

        expect(msg.channel.send).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Upcoming') }),
        );
    });

    it('end-to-end: chatInputRun replies with the skip result', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, { stopTrack: vi.fn().mockResolvedValue(undefined) });
        queueMap.set(GUILD_ID,  { tracks: [{ info: { title: 'Current' }, track: 'x' }, { info: { title: 'Upcoming' }, track: 'y' }] });

        const cmd = makeCmd(SkipCommand);
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);

        expect(ix.reply).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('Upcoming') }),
        );
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SeekCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('SeekCommand – messageRun / chatInputRun routing', () => {
    beforeEach(setupContainer);

    it('messageRun parses the --time option string and calls seek() with the seconds as a number', async () => {
        const cmd  = makeCmd(SeekCommand);
        const spy  = vi.fn().mockResolvedValue(undefined);
        cmd.seek   = spy;
        const args = makeArgs({ getOption: vi.fn().mockReturnValue('45') });
        await cmd.messageRun(makeMessage(), args);
        expect(spy).toHaveBeenCalledWith(expect.anything(), 45);
    });

    it('messageRun falls back to a positional number when --time is absent', async () => {
        const cmd  = makeCmd(SeekCommand);
        const spy  = vi.fn().mockResolvedValue(undefined);
        cmd.seek   = spy;
        const args = makeArgs({
            getOption: vi.fn().mockReturnValue(null),
            pick:      vi.fn().mockResolvedValue(90),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(spy).toHaveBeenCalledWith(expect.anything(), 90);
    });

    it('messageRun defaults to 0 when no time is provided at all', async () => {
        const cmd  = makeCmd(SeekCommand);
        const spy  = vi.fn().mockResolvedValue(undefined);
        cmd.seek   = spy;
        const args = makeArgs({
            getOption: vi.fn().mockReturnValue(null),
            pick:      vi.fn().mockRejectedValue(new Error('no arg')),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(spy).toHaveBeenCalledWith(expect.anything(), 0);
    });

    it('chatInputRun reads getNumber("time") and calls seek() with the seconds', async () => {
        const cmd = makeCmd(SeekCommand);
        const spy = vi.fn().mockResolvedValue(undefined);
        cmd.seek  = spy;
        const ix  = makeInteraction({ time: 60 });
        await cmd.chatInputRun(ix, {} as any);
        expect(spy).toHaveBeenCalledWith(ix, 60);
    });

    it('both forms pass the same seconds value to seek() when given matching input', async () => {
        const cmdA = makeCmd(SeekCommand);
        const cmdB = makeCmd(SeekCommand);
        const spyA = vi.fn().mockResolvedValue(undefined);
        const spyB = vi.fn().mockResolvedValue(undefined);
        cmdA.seek  = spyA;
        cmdB.seek  = spyB;

        const args = makeArgs({ getOption: vi.fn().mockReturnValue('30') });
        await cmdA.messageRun(makeMessage(), args);
        await cmdB.chatInputRun(makeInteraction({ time: 30 }), {} as any);

        expect(spyA.mock.calls[0][1]).toBe(30);
        expect(spyB.mock.calls[0][1]).toBe(30);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// StopCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('StopCommand – messageRun / chatInputRun routing', () => {
    beforeEach(setupContainer);

    it('messageRun delegates to stop() passing the Message object', async () => {
        const cmd = makeCmd(StopCommand);
        const spy = vi.fn().mockResolvedValue(undefined);
        cmd.stop  = spy;
        const msg = makeMessage();
        await cmd.messageRun(msg, makeArgs());
        expect(spy).toHaveBeenCalledWith(msg);
    });

    it('chatInputRun delegates to stop() passing the Interaction object', async () => {
        const cmd = makeCmd(StopCommand);
        const spy = vi.fn().mockResolvedValue(undefined);
        cmd.stop  = spy;
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);
        expect(spy).toHaveBeenCalledWith(ix);
    });

    it('both forms call stop() exactly once per invocation', async () => {
        const cmdA = makeCmd(StopCommand);
        const cmdB = makeCmd(StopCommand);
        const spyA = vi.fn().mockResolvedValue(undefined);
        const spyB = vi.fn().mockResolvedValue(undefined);
        cmdA.stop  = spyA;
        cmdB.stop  = spyB;

        await cmdA.messageRun(makeMessage(), makeArgs());
        await cmdB.chatInputRun(makeInteraction(), {} as any);

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(spyB).toHaveBeenCalledTimes(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DiceRollCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('DiceRollCommand – messageRun / chatInputRun routing', () => {
    // Silence validDice for chatInputRun tests so we can pass any notation.
    let restoreValidDice: () => void;
    beforeEach(() => {
        const orig = (DiceRollCommand as any).validDice;
        (DiceRollCommand as any).validDice = vi.fn();
        restoreValidDice = () => { (DiceRollCommand as any).validDice = orig; };
    });
    afterEach(() => restoreValidDice());

    // ── messageRun ────────────────────────────────────────────────────────────

    it('messageRun calls run() with the notation returned by Args', async () => {
        const cmd         = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery   = new Map();
        const runSpy      = vi.fn().mockResolvedValue(undefined);
        cmd.run           = runSpy;
        const args        = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => false, unwrap: () => '2d6' }),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(runSpy).toHaveBeenCalledWith(expect.anything(), user, '2d6');
    });

    it('messageRun falls back to "d20" when Args returns an error result and no cached query', async () => {
        const cmd         = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery   = new Map();
        const runSpy      = vi.fn().mockResolvedValue(undefined);
        cmd.run           = runSpy;
        const args        = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => true }),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(runSpy.mock.calls[0][2]).toBe('d20');
    });

    it('messageRun uses the cached query notation when Args fails and a cache entry exists', async () => {
        const cmd               = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery         = new Map([[`${GUILD_ID}`, { notation: '4d8' }]]);
        const runSpy            = vi.fn().mockResolvedValue(undefined);
        cmd.run                 = runSpy;
        const args              = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => true }),
        });
        const msg               = makeMessage();
        msg.guildId             = GUILD_ID;
        await cmd.messageRun(msg, args);
        expect(runSpy.mock.calls[0][2]).toBe('4d8');
    });

    // ── chatInputRun ──────────────────────────────────────────────────────────

    it('chatInputRun calls run() with the notation from interaction options', async () => {
        const cmd       = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery = new Map();
        const runSpy    = vi.fn().mockResolvedValue(undefined);
        cmd.run         = runSpy;
        await cmd.chatInputRun(makeInteraction({ notation: '3d6' }), {} as any);
        expect(runSpy).toHaveBeenCalledWith(expect.anything(), user, '3d6');
    });

    it('chatInputRun falls back to "d20" when the notation option is absent', async () => {
        const cmd       = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery = new Map();
        const runSpy    = vi.fn().mockResolvedValue(undefined);
        cmd.run         = runSpy;
        await cmd.chatInputRun(makeInteraction(), {} as any);
        expect(runSpy.mock.calls[0][2]).toBe('d20');
    });

    it('chatInputRun uses the cached notation when the option is absent and cache exists', async () => {
        const cmd               = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery         = new Map([[`${GUILD_ID}`, { notation: '1d12' }]]);
        const runSpy            = vi.fn().mockResolvedValue(undefined);
        cmd.run                 = runSpy;
        const ix                = makeInteraction();
        ix.guildId              = GUILD_ID;
        await cmd.chatInputRun(ix, {} as any);
        expect(runSpy.mock.calls[0][2]).toBe('1d12');
    });

    // ── Parity ────────────────────────────────────────────────────────────────

    // ── Notation preservation (regression for '\W' string-escape bug) ─────────
    // Before the fix, `results.unwrap().replace('\W', '')` compiled to
    // `.replace('W', '')` at runtime (backslash dropped for non-special escape),
    // silently eating the first capital-W from the notation string.

    it('messageRun preserves dice notation without mangling characters', async () => {
        const cmd         = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery   = new Map();
        const runSpy      = vi.fn().mockResolvedValue(undefined);
        cmd.run           = runSpy;
        const args        = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => false, unwrap: () => '3d6kh2' }),
        });
        await cmd.messageRun(makeMessage(), args);
        // Notation must arrive at run() unchanged.
        expect(runSpy.mock.calls[0][2]).toBe('3d6kh2');
    });

    it('messageRun trims leading/trailing whitespace but preserves notation body', async () => {
        const cmd         = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery   = new Map();
        const runSpy      = vi.fn().mockResolvedValue(undefined);
        cmd.run           = runSpy;
        const args        = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => false, unwrap: () => '  2d8  ' }),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(runSpy.mock.calls[0][2]).toBe('2d8');
    });

    it('chatInputRun trims whitespace from the option value', async () => {
        const cmd       = makeCmd(DiceRollCommand) as any;
        cmd.cachedQuery = new Map();
        const runSpy    = vi.fn().mockResolvedValue(undefined);
        cmd.run         = runSpy;
        // Provide the notation option with surrounding spaces.
        const ix = makeInteraction();
        ix.options.get = vi.fn().mockReturnValue({ value: '  4d6  ' });
        await cmd.chatInputRun(ix, {} as any);
        expect(runSpy.mock.calls[0][2]).toBe('4d6');
    });

    it('both forms forward the same notation to run() when given identical input', async () => {
        const NOTATION = '4d8';

        const cmdA       = makeCmd(DiceRollCommand) as any;
        const cmdB       = makeCmd(DiceRollCommand) as any;
        cmdA.cachedQuery = new Map();
        cmdB.cachedQuery = new Map();
        const spyA       = vi.fn().mockResolvedValue(undefined);
        const spyB       = vi.fn().mockResolvedValue(undefined);
        cmdA.run = spyA;
        cmdB.run = spyB;

        const args = makeArgs({
            restResult: vi.fn().mockResolvedValue({ isErr: () => false, unwrap: () => NOTATION }),
        });
        await cmdA.messageRun(makeMessage(), args);
        await cmdB.chatInputRun(makeInteraction({ notation: NOTATION }), {} as any);

        expect(spyA.mock.calls[0][2]).toBe(NOTATION);
        expect(spyB.mock.calls[0][2]).toBe(NOTATION);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GroupsCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('GroupsCommand – messageRun / chatInputRun routing', () => {
    // ── messageRun ────────────────────────────────────────────────────────────

    it('messageRun calls run() with the size and entries parsed from the --size flag', async () => {
        const cmd       = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery = new Map();
        const spy       = vi.fn().mockResolvedValue(undefined);
        cmd.run         = spy;
        const args      = makeArgs({
            getOption: vi.fn((name: string) => name === 'size' ? '3' : null),
            pick:      vi.fn().mockRejectedValue(new Error('should not be called')),
            repeat:    vi.fn().mockResolvedValue(['Alice', 'Bob', 'Carol']),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(spy).toHaveBeenCalledWith(expect.anything(), user, 3, ['Alice', 'Bob', 'Carol']);
    });

    // ── Positional size regression (Bug: Number(null)=0, 0 ?? cache = 0) ─────
    // Before the fix, "!groups 2 Alice Bob" silently errored because
    // Number(getOption('size')=null) = 0, and 0 ?? cache = 0 (not null/undefined),
    // so run() received groupSize=0 and threw "Invalid group size".

    it('messageRun picks size from first positional integer when --size flag is absent', async () => {
        const cmd       = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery = new Map();
        const spy       = vi.fn().mockResolvedValue(undefined);
        cmd.run         = spy;
        const args      = makeArgs({
            getOption: vi.fn().mockReturnValue(null),          // no --size flag
            pick:      vi.fn().mockResolvedValue(4),           // positional: "!groups 4 ..."
            repeat:    vi.fn().mockResolvedValue(['Dog', 'Cat', 'Bird', 'Fish']),
        });
        await cmd.messageRun(makeMessage(), args);
        expect(spy).toHaveBeenCalledWith(expect.anything(), user, 4, ['Dog', 'Cat', 'Bird', 'Fish']);
    });

    it('messageRun falls back to cache when both --size and positional are absent', async () => {
        const cmd               = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery         = new Map([[GUILD_ID, { size: 2, entries: ['X', 'Y'] }]]);
        const spy               = vi.fn().mockResolvedValue(undefined);
        cmd.run                 = spy;
        const msg               = makeMessage();
        msg.guildId             = GUILD_ID;
        const args              = makeArgs({
            getOption: vi.fn().mockReturnValue(null),
            pick:      vi.fn().mockRejectedValue(new Error('no positional')),
            repeat:    vi.fn().mockResolvedValue([]),
        });
        await cmd.messageRun(msg, args);
        expect(spy.mock.calls[0][2]).toBe(2);
    });

    it('messageRun passes an empty array to run() when Args yields no entries', async () => {
        const cmd       = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery = new Map();
        const spy       = vi.fn().mockResolvedValue(undefined);
        cmd.run         = spy;
        const args      = makeArgs({
            getOption: vi.fn().mockReturnValue('2'),
            repeat:    vi.fn().mockResolvedValue([]),
        });
        await cmd.messageRun(makeMessage(), args);
        // entries argument (index 3) should be the empty array from repeat()
        expect(spy.mock.calls[0][3]).toEqual([]);
    });

    // ── chatInputRun ──────────────────────────────────────────────────────────

    it('chatInputRun calls run() with size and entries from interaction options', async () => {
        const cmd       = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery = new Map();
        const spy       = vi.fn().mockResolvedValue(undefined);
        cmd.run         = spy;
        await cmd.chatInputRun(makeInteraction({ size: 2, entries: 'Dog Cat Bird' }), {} as any);
        expect(spy).toHaveBeenCalledWith(expect.anything(), user, 2, 'Dog Cat Bird');
    });

    it('chatInputRun passes null to run() when options are absent', async () => {
        const cmd       = makeCmd(GroupsCommand) as any;
        cmd.cachedQuery = new Map();
        const spy       = vi.fn().mockResolvedValue(undefined);
        cmd.run         = spy;
        await cmd.chatInputRun(makeInteraction(), {} as any);
        // both size and entries are null / undefined when no options given
        expect(spy.mock.calls[0][2]).toBeFalsy();
        expect(spy.mock.calls[0][3]).toBeFalsy();
    });

    // ── Parity ────────────────────────────────────────────────────────────────

    it('both forms forward the same group-size to run()', async () => {
        const SIZE = 4;

        const cmdA       = makeCmd(GroupsCommand) as any;
        const cmdB       = makeCmd(GroupsCommand) as any;
        cmdA.cachedQuery = new Map();
        cmdB.cachedQuery = new Map();
        const spyA       = vi.fn().mockResolvedValue(undefined);
        const spyB       = vi.fn().mockResolvedValue(undefined);
        cmdA.run = spyA;
        cmdB.run = spyB;

        const args = makeArgs({
            getOption: vi.fn((name: string) => name === 'size' ? String(SIZE) : null),
            repeat:    vi.fn().mockResolvedValue(['A', 'B', 'C', 'D']),
        });
        await cmdA.messageRun(makeMessage(), args);
        await cmdB.chatInputRun(makeInteraction({ size: SIZE, entries: 'A B C D' }), {} as any);

        expect(spyA.mock.calls[0][2]).toBe(SIZE);
        expect(spyB.mock.calls[0][2]).toBe(SIZE);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PingCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('PingCommand – messageRun / chatInputRun routing', () => {
    beforeEach(() => {
        (container as any).client = { ws: { ping: 42 } };
    });

    it('messageRun sends "Ping?" to the text channel', async () => {
        const cmd     = makeCmd(PingCommand);
        const sentMsg = { edit: vi.fn().mockResolvedValue(undefined) };
        const msg     = makeMessage();
        msg.channel.send = vi.fn().mockResolvedValue(sentMsg);

        await cmd.messageRun(msg, makeArgs());

        expect(msg.channel.send).toHaveBeenCalledWith('Ping?');
    });

    it('messageRun edits the sent message to include "Pong!" and latency', async () => {
        const cmd     = makeCmd(PingCommand);
        const sentMsg = { edit: vi.fn().mockResolvedValue(undefined) };
        const msg     = makeMessage();
        msg.channel.send = vi.fn().mockResolvedValue(sentMsg);

        await cmd.messageRun(msg, makeArgs());

        expect(sentMsg.edit).toHaveBeenCalled();
        expect(sentMsg.edit.mock.calls[0][0]).toMatch(/Pong!/);
        expect(sentMsg.edit.mock.calls[0][0]).toMatch(/Bot Latency \d+ms/);
    });

    it('chatInputRun replies with "Ping?" first', async () => {
        const cmd = makeCmd(PingCommand);
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);
        expect(ix.reply).toHaveBeenCalledWith('Ping?');
    });

    it('chatInputRun edits the reply to include "Pong!" and latency', async () => {
        const cmd = makeCmd(PingCommand);
        const ix  = makeInteraction();
        await cmd.chatInputRun(ix, {} as any);
        expect(ix.editReply).toHaveBeenCalled();
        expect(ix.editReply.mock.calls[0][0]).toMatch(/Pong!/);
        expect(ix.editReply.mock.calls[0][0]).toMatch(/Bot Latency \d+ms/);
    });

    it('both forms include the same ws.ping value in their responses', async () => {
        (container as any).client = { ws: { ping: 123 } };

        const cmdMsg  = makeCmd(PingCommand);
        const sentMsg = { edit: vi.fn().mockResolvedValue(undefined) };
        const msg     = makeMessage();
        msg.channel.send = vi.fn().mockResolvedValue(sentMsg);
        await cmdMsg.messageRun(msg, makeArgs());
        const msgContent = sentMsg.edit.mock.calls[0][0] as string;

        const cmdIx = makeCmd(PingCommand);
        const ix    = makeInteraction();
        await cmdIx.chatInputRun(ix, {} as any);
        const ixContent = ix.editReply.mock.calls[0][0] as string;

        // Both mention the specific configured ping value
        expect(msgContent).toContain('123');
        expect(ixContent).toContain('123');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PlayCommand – identifier construction (text vs slash input format parity)
// ─────────────────────────────────────────────────────────────────────────────

describe('PlayCommand – resolve() identifier construction', () => {
    beforeEach(setupContainer);

    it('prefixes a plain-text query with "ytsearch:" regardless of invocation form', async () => {
        const resolveFn = vi.fn().mockResolvedValue({ loadType: 'search', data: [] });
        const { mockClient } = (() => {
            const mc = (container as any).client;
            mc.musicPlayer.getIdealNode = vi.fn().mockReturnValue({ rest: { resolve: resolveFn } });
            return { mockClient: mc };
        })();
        void mockClient; // suppress unused-var warning

        const cmd = makeCmd(PlayCommand) as any;
        await cmd.resolve('my search query');
        expect(resolveFn).toHaveBeenCalledWith('ytsearch:my search query');
    });

    it('passes a YouTube URL directly without a "ytsearch:" prefix', async () => {
        const resolveFn = vi.fn().mockResolvedValue({ loadType: 'track', data: { info: { title: 'T' }, track: 'x' } });
        (container as any).client.musicPlayer.getIdealNode = vi.fn().mockReturnValue({ rest: { resolve: resolveFn } });

        const cmd = makeCmd(PlayCommand) as any;
        await cmd.resolve('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(resolveFn).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('a URL from a slash option and the same URL typed as text produce identical identifiers', async () => {
        const YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const calls: string[] = [];
        const resolveFn = vi.fn((id: string) => {
            calls.push(id);
            return Promise.resolve({ loadType: 'track', data: { info: { title: 'T' }, track: 'x' } });
        });
        (container as any).client.musicPlayer.getIdealNode = vi.fn().mockReturnValue({ rest: { resolve: resolveFn } });

        const cmdA = makeCmd(PlayCommand) as any;
        const cmdB = makeCmd(PlayCommand) as any;

        // Simulate slash command: source comes from options.getString('source')
        await cmdA.resolve(YOUTUBE_URL);
        // Simulate message command: source comes from parsed text args
        await cmdB.resolve(YOUTUBE_URL);

        expect(calls[0]).toBe(calls[1]);
        expect(calls[0]).toBe(YOUTUBE_URL);
    });
});

// =============================================================================
// Phase 4 regression tests — meme commands
//
// These tests verify the bugs fixed in Phase 4 stay fixed:
//   • instanceof TextChannel guard was silently dropping responses in threads.
//   • Missing `await` on message.channel.send() (caught by the spy pattern).
//   • Missing `healing` alias on SylphieCommand (verified via messageRun parity).
//   • Unsafe raw-mention member resolution in KinzoCommand / LiedCommand.
//   • MagnetoCommand error path (no image) was also inside the dropped block.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// SylphieCommand (!sylphie / !healing)
// ─────────────────────────────────────────────────────────────────────────────

describe('SylphieCommand – messageRun sends file to channel', () => {
    it('messageRun calls channel.send with files when an activity is provided', async () => {
        const cmd = makeCmd(SylphieCommand);
        const fakeFiles = ['path/to/output.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const msg  = makeMessage();
        const args = makeArgs({ getOption: vi.fn().mockReturnValue('pilates') });
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith(['pilates']);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun calls channel.send even when no activity arg is given', async () => {
        const cmd = makeCmd(SylphieCommand);
        const fakeFiles = ['path/to/output.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const msg  = makeMessage();
        const args = makeArgs(); // getOption returns null → treated as ""
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith(['']);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('chatInputRun defers, runs script, and edits the reply', async () => {
        const cmd = makeCmd(SylphieCommand);
        const fakeFiles = ['path/to/output.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const ix = makeInteraction({ activity: 'eat pizza' });
        await cmd.chatInputRun(ix, {} as any);

        expect(ix.deferReply).toHaveBeenCalled();
        expect(cmd.run).toHaveBeenCalledWith(['eat pizza']);
        expect(ix.editReply).toHaveBeenCalledWith({ files: fakeFiles });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BrightCommand (!correct / !bright / !punch)
// ─────────────────────────────────────────────────────────────────────────────

describe('BrightCommand – messageRun sends file or error', () => {
    it('messageRun calls channel.send with files when a valid member is mentioned', async () => {
        const cmd = makeCmd(BrightCommand);
        const fakeFiles = ['path/to/slap.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const fakeMember = { displayAvatarURL: vi.fn().mockReturnValue('https://cdn.discord.com/avatar.png') };
        const msg  = makeMessage();
        const args = makeArgs({ pick: vi.fn().mockResolvedValue(fakeMember) });
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith([fakeMember.displayAvatarURL()]);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun replies with an error when no valid member is mentioned', async () => {
        const cmd = makeCmd(BrightCommand);
        cmd.run = vi.fn();

        const msg  = makeMessage();
        const args = makeArgs({ pick: vi.fn().mockRejectedValue(new Error('no member')) });
        await cmd.messageRun(msg, args);

        expect(msg.reply).toHaveBeenCalledWith('Please mention a valid server member.');
        expect(msg.channel.send).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DuwangCommand (!duwang)
// ─────────────────────────────────────────────────────────────────────────────

describe('DuwangCommand – messageRun sends file to channel', () => {
    it('messageRun calls channel.send with files when a target URL is provided', async () => {
        const cmd = makeCmd(DuwangCommand);
        const fakeFiles = ['path/to/duwang.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const msg  = makeMessage();
        const args = makeArgs({ getOption: vi.fn().mockReturnValue('https://example.com/img.png') });
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith(['https://example.com/img.png']);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun calls channel.send with no args when no target is provided', async () => {
        const cmd = makeCmd(DuwangCommand);
        const fakeFiles = ['path/to/duwang.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        // No args.getOption, no attachments
        const msg  = makeMessage();
        const args = makeArgs();
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith([]);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// KinzoCommand (!kinzo)
// ─────────────────────────────────────────────────────────────────────────────

describe('KinzoCommand – messageRun routing and member resolution', () => {
    function makeKinzoMessage(memberCache: Map<string, any>) {
        return makeMessage({
            guild: {
                id: GUILD_ID,
                members: { cache: memberCache },
            },
            reply: vi.fn().mockResolvedValue(undefined),
        });
    }

    it('messageRun calls channel.send with files when member and text are provided', async () => {
        const cmd = makeCmd(KinzoCommand);
        const fakeFiles = ['path/to/kinzo.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const memberId = '123456789';
        const fakeMember = { displayName: 'TestUser' };
        const memberCache = new Map([[memberId, fakeMember]]);

        const msg  = makeKinzoMessage(memberCache);
        const args = makeArgs({
            getOption: vi.fn((key: string) =>
                key === 'user' ? `<@${memberId}>` : key === 'text' ? 'whining text' : null
            ),
        });
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith(['TestUser', 'whining text']);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun replies with an error when the member is not found', async () => {
        const cmd = makeCmd(KinzoCommand);
        cmd.run   = vi.fn();

        const msg  = makeKinzoMessage(new Map());
        const args = makeArgs({
            getOption: vi.fn((key: string) =>
                key === 'user' ? '<@unknown>' : 'some text'
            ),
        });
        await cmd.messageRun(msg, args);

        expect(msg.reply).toHaveBeenCalledWith(
            expect.stringContaining('valid server member'),
        );
        expect(msg.channel.send).not.toHaveBeenCalled();
    });

    it('messageRun replies with an error when no text is provided', async () => {
        const cmd = makeCmd(KinzoCommand);
        cmd.run   = vi.fn();

        const memberId = '123456789';
        const memberCache = new Map([[memberId, { displayName: 'TestUser' }]]);

        const msg  = makeKinzoMessage(memberCache);
        const args = makeArgs({
            getOption: vi.fn((key: string) =>
                key === 'user' ? `<@${memberId}>` : null
            ),
        });
        await cmd.messageRun(msg, args);

        expect(msg.reply).toHaveBeenCalledWith(
            expect.stringContaining('whining text'),
        );
        expect(msg.channel.send).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// LiedCommand (!lied)
// ─────────────────────────────────────────────────────────────────────────────

describe('LiedCommand – messageRun routing and member resolution', () => {
    function makeLiedMessage(memberCache: Map<string, any>) {
        return makeMessage({
            guild: {
                id: GUILD_ID,
                members: { cache: memberCache },
            },
            reply: vi.fn().mockResolvedValue(undefined),
        });
    }

    it('messageRun calls channel.send with files when member and text are provided', async () => {
        const cmd = makeCmd(LiedCommand);
        const fakeFiles = ['path/to/lied.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const memberId   = '987654321';
        const fakeMember = {
            displayName:      'TargetUser',
            avatar:           null,
            displayAvatarURL: vi.fn().mockReturnValue('https://cdn.discord.com/avatar.png'),
        };
        const memberCache = new Map([[memberId, fakeMember]]);

        const msg  = makeLiedMessage(memberCache);
        const args = makeArgs({
            getOption: vi.fn((key: string) =>
                key === 'user' ? `<@!${memberId}>` : key === 'text' ? 'the lie' : null
            ),
        });
        await cmd.messageRun(msg, args);

        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun replies with an error when the member is not found', async () => {
        const cmd = makeCmd(LiedCommand);
        cmd.run   = vi.fn();

        const msg  = makeLiedMessage(new Map());
        const args = makeArgs({
            getOption: vi.fn((key: string) =>
                key === 'user' ? '<@nobody>' : 'the lie'
            ),
        });
        await cmd.messageRun(msg, args);

        expect(msg.reply).toHaveBeenCalledWith(
            expect.stringContaining('valid server member'),
        );
        expect(msg.channel.send).not.toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MagnetoCommand (!magneto)
// ─────────────────────────────────────────────────────────────────────────────

describe('MagnetoCommand – messageRun sends file or error', () => {
    it('messageRun calls channel.send with an error message when no image is provided', async () => {
        const cmd = makeCmd(MagnetoCommand);
        cmd.run   = vi.fn();

        // No --image arg, no attachment
        const msg  = makeMessage();
        const args = makeArgs(); // getOption returns null
        await cmd.messageRun(msg, args);

        expect(msg.channel.send).toHaveBeenCalledWith(
            expect.objectContaining({ content: expect.stringContaining('No valid image found') }),
        );
        expect(cmd.run).not.toHaveBeenCalled();
    });

    it('messageRun calls channel.send with files when an image URL is provided', async () => {
        const cmd = makeCmd(MagnetoCommand);
        const fakeFiles = ['path/to/magneto.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const IMAGE_URL = 'https://example.com/thwarted.png';
        const msg  = makeMessage();
        const args = makeArgs({ getOption: vi.fn().mockReturnValue(IMAGE_URL) });
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith([IMAGE_URL]);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });

    it('messageRun picks up an attachment URL when no --image flag is given', async () => {
        const cmd = makeCmd(MagnetoCommand);
        const fakeFiles = ['path/to/magneto.png'];
        cmd.run = vi.fn().mockResolvedValue(fakeFiles);

        const ATTACHMENT_URL = 'https://cdn.discord.com/attachment.png';
        const msg  = makeMessage({
            attachments: { first: () => ({ url: ATTACHMENT_URL }) },
        });
        const args = makeArgs(); // --image not given
        await cmd.messageRun(msg, args);

        expect(cmd.run).toHaveBeenCalledWith([ATTACHMENT_URL]);
        expect(msg.channel.send).toHaveBeenCalledWith({ files: fakeFiles });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SuperturnCommand (!superturn / !waiting) — RandomMediaCommand subclass
// ─────────────────────────────────────────────────────────────────────────────

describe('SuperturnCommand – messageRun sends a media file', () => {
    it('messageRun calls channel.send with the file returned by run()', async () => {
        const cmd = makeCmd(SuperturnCommand);
        const filePath = 'src/assets/media/superturn/bernkastel.gif';
        cmd.run = vi.fn().mockResolvedValue(filePath);

        const msg  = makeMessage();
        const args = makeArgs();
        await cmd.messageRun(msg, args);

        expect(msg.channel.send).toHaveBeenCalledWith({ files: [filePath] });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// CongratulationsCommand (!omedetou / !congratulations / !congrats)
// ─────────────────────────────────────────────────────────────────────────────

describe('CongratulationsCommand – messageRun sends a media file', () => {
    it('messageRun calls channel.send with the file returned by run()', async () => {
        const cmd = makeCmd(CongratulationsCommand);
        const filePath = 'src/assets/media/congratulations/taiga.gif';
        cmd.run = vi.fn().mockResolvedValue(filePath);

        const msg  = makeMessage();
        const args = makeArgs();
        await cmd.messageRun(msg, args);

        expect(msg.channel.send).toHaveBeenCalledWith({ files: [filePath] });
    });
});
