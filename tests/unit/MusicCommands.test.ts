/**
 * Unit tests for all music commands: Pause, Resume, Skip, Seek, Stop, Play.
 *
 * Every test uses lightweight stubs injected into the Sapphire container –
 * no real Discord client, Lavalink node, or HTTP traffic is needed.
 *
 * Key technique: `Object.create(XxxCommand.prototype)` produces an instance
 * without running the Sapphire/Discord.js constructor chain.  `this.container`
 * inside every Command is a getter that returns the module-level Sapphire
 * `container` singleton, which we populate with a mock client before each test.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '@sapphire/framework';

import { PauseCommand } from '../../src/commands/music/Pause';
import { PlayCommand } from '../../src/commands/music/Play';
import { ResumeCommand } from '../../src/commands/music/Resume';
import { SeekCommand } from '../../src/commands/music/Seek';
import { SkipCommand } from '../../src/commands/music/Skip';
import { StopCommand } from '../../src/commands/music/Stop';

// ── Stub factories ────────────────────────────────────────────────────────────

/** Minimal track shape returned by the Lavalink REST API. */
function makeTrack(title = 'Test Track') {
    return { info: { title }, track: 'base64-encoded-track' };
}

/** Shoukaku Player stub with all relevant methods mocked. */
function makePlayer(overrides: Record<string, unknown> = {}) {
    return {
        paused: false,
        setPaused: vi.fn(),
        stopTrack: vi.fn().mockResolvedValue(undefined),
        seekTo: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

/**
 * Minimal interaction-like object.  Plain objects are not `instanceof Message`
 * so the commands' `else` branch (`interaction.reply`) is exercised here.
 */
function makeInteraction(guildId = 'guild-001') {
    return {
        guildId,
        reply: vi.fn().mockResolvedValue(undefined),
    } as any;
}

/**
 * Instantiate a command class without the Sapphire store constructor chain.
 * `this.container` in every Command is a getter returning `container`, so
 * injecting into the Sapphire singleton is sufficient.
 */
function makeCmd<T>(Ctor: new (...args: any[]) => T): T {
    return Object.create((Ctor as any).prototype) as T;
}

const GUILD_ID = 'guild-001';
const guild    = { id: GUILD_ID } as any;

// ── Container setup helper ────────────────────────────────────────────────────

/**
 * Replaces `container.client` with a fresh mock before each test.
 * Returns the underlying Maps so individual tests can populate them.
 */
function setupContainer() {
    const playerMap = new Map<string, ReturnType<typeof makePlayer>>();
    const queueMap  = new Map<string, { tracks: ReturnType<typeof makeTrack>[] }>();

    const mockClient = {
        musicPlayer: {
            players: playerMap,
            getIdealNode: vi.fn(),
            leaveVoiceChannel: vi.fn(),
            joinVoiceChannel: vi.fn().mockResolvedValue(makePlayer()),
        },
        musicQueue: queueMap,
    };

    (container as any).client = mockClient;
    return { playerMap, queueMap, mockClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// PauseCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('PauseCommand – pause()', () => {
    beforeEach(setupContainer);

    it('returns error when no player exists for the guild', () => {
        const cmd = makeCmd(PauseCommand);
        expect(cmd.pause(guild)).toContain('No track currently playing.');
    });

    it('returns error when a player exists but there is no queue entry', () => {
        const { playerMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer());
        // queueMap intentionally left empty
        const cmd = makeCmd(PauseCommand);
        expect(cmd.pause(guild)).toContain('No track currently playing.');
    });

    it('returns error when the queue exists but is empty', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer());
        queueMap.set(GUILD_ID, { tracks: [] });
        const cmd = makeCmd(PauseCommand);
        expect(cmd.pause(guild)).toContain('No track currently playing.');
    });

    it('returns error when playback is already paused', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer({ paused: true }));
        queueMap.set(GUILD_ID, { tracks: [makeTrack()] });
        const cmd = makeCmd(PauseCommand);
        expect(cmd.pause(guild)).toContain('already paused');
    });

    it('calls setPaused(true) and returns confirmation with the track title', () => {
        const player = makePlayer({ paused: false });
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack('My Cool Song')] });
        const cmd    = makeCmd(PauseCommand);
        const result = cmd.pause(guild);
        expect(player.setPaused).toHaveBeenCalledWith(true);
        expect(result).toContain('Paused');
        expect(result).toContain('My Cool Song');
    });

    it('uses "Unknown" as a fallback title when track info has no title', () => {
        const player = makePlayer({ paused: false });
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [{ info: {}, track: 'x' }] });
        const cmd    = makeCmd(PauseCommand);
        const result = cmd.pause(guild);
        expect(result).toContain('Unknown');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResumeCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('ResumeCommand – resume()', () => {
    beforeEach(setupContainer);

    it('returns error when no player exists for the guild', () => {
        const cmd = makeCmd(ResumeCommand);
        expect(cmd.resume(guild)).toContain('No track currently paused.');
    });

    it('returns error when queue exists but is empty', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer({ paused: true }));
        queueMap.set(GUILD_ID, { tracks: [] });
        const cmd = makeCmd(ResumeCommand);
        expect(cmd.resume(guild)).toContain('No track currently paused.');
    });

    it('returns error when playback is not paused', () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer({ paused: false }));
        queueMap.set(GUILD_ID, { tracks: [makeTrack()] });
        const cmd = makeCmd(ResumeCommand);
        expect(cmd.resume(guild)).toContain('not paused');
    });

    it('calls setPaused(false) and returns confirmation with the track title', () => {
        const player = makePlayer({ paused: true });
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack('Chill Vibes')] });
        const cmd    = makeCmd(ResumeCommand);
        const result = cmd.resume(guild);
        expect(player.setPaused).toHaveBeenCalledWith(false);
        expect(result).toContain('Resumed');
        expect(result).toContain('Chill Vibes');
    });

    it('uses "Unknown" as a fallback title when track info has no title', () => {
        const player = makePlayer({ paused: true });
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [{ info: {}, track: 'x' }] });
        const cmd    = makeCmd(ResumeCommand);
        const result = cmd.resume(guild);
        expect(result).toContain('Unknown');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkipCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('SkipCommand – skip()', () => {
    beforeEach(setupContainer);

    it('returns error when no player exists', async () => {
        const cmd = makeCmd(SkipCommand);
        expect(await cmd.skip(guild)).toContain('no music currently playing');
    });

    it('returns error when queue is empty', async () => {
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer());
        queueMap.set(GUILD_ID, { tracks: [] });
        const cmd = makeCmd(SkipCommand);
        expect(await cmd.skip(guild)).toContain('no music currently playing');
    });

    it('calls stopTrack and reports "End of queue" when the last track is skipped', async () => {
        const player = makePlayer();
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack('Only Track')] });
        const cmd    = makeCmd(SkipCommand);
        const result = await cmd.skip(guild);
        expect(player.stopTrack).toHaveBeenCalled();
        expect(result).toContain('End of queue');
    });

    it('calls stopTrack and shows the next track title when queue has more entries', async () => {
        const player = makePlayer();
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack('Current'), makeTrack('Up Next')] });
        const cmd    = makeCmd(SkipCommand);
        const result = await cmd.skip(guild);
        expect(player.stopTrack).toHaveBeenCalled();
        expect(result).toContain('Up Next');
    });

    it('uses "Unknown" as a fallback when the next track title is missing', async () => {
        const player = makePlayer();
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack('Current'), { info: {}, track: 'x' }] });
        const cmd    = makeCmd(SkipCommand);
        const result = await cmd.skip(guild);
        expect(result).toContain('Unknown');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// SeekCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('SeekCommand – seek()', () => {
    beforeEach(setupContainer);

    it('replies with "No track currently playing" embed when no player exists', async () => {
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(SeekCommand);
        await cmd.seek(interaction, 30);
        expect(interaction.reply).toHaveBeenCalled();
        const [call] = interaction.reply.mock.calls;
        expect(call[0].embeds[0].data.description).toContain('No track currently playing');
    });

    it('replies with "No track currently playing" when queue is missing', async () => {
        const { playerMap } = setupContainer();
        playerMap.set(GUILD_ID, makePlayer());
        // queueMap intentionally left empty (musicQueue.has() → false)
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(SeekCommand);
        await cmd.seek(interaction, 10);
        const [call] = interaction.reply.mock.calls;
        expect(call[0].embeds[0].data.description).toContain('No track currently playing');
    });

    it('calls seekTo with the correct millisecond value', async () => {
        const player = makePlayer();
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack()] });
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(SeekCommand);
        await cmd.seek(interaction, 45);
        expect(player.seekTo).toHaveBeenCalledWith(45_000);
    });

    it('replies with the seeked-to position in the confirmation embed', async () => {
        const player = makePlayer();
        const { playerMap, queueMap } = setupContainer();
        playerMap.set(GUILD_ID, player);
        queueMap.set(GUILD_ID, { tracks: [makeTrack()] });
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(SeekCommand);
        await cmd.seek(interaction, 120);
        const [call] = interaction.reply.mock.calls;
        expect(call[0].embeds[0].data.description).toContain('120');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// StopCommand
// ─────────────────────────────────────────────────────────────────────────────

describe('StopCommand – stop()', () => {
    beforeEach(setupContainer);

    it('calls leaveVoiceChannel and deletes the guild queue', async () => {
        const { queueMap, mockClient } = setupContainer();
        queueMap.set(GUILD_ID, { tracks: [makeTrack()] });
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(StopCommand);
        await cmd.stop(interaction);
        expect(mockClient.musicPlayer.leaveVoiceChannel).toHaveBeenCalledWith(GUILD_ID);
        expect(queueMap.has(GUILD_ID)).toBe(false);
    });

    it('replies with a stop embed', async () => {
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(StopCommand);
        await cmd.stop(interaction);
        expect(interaction.reply).toHaveBeenCalled();
        const [call] = interaction.reply.mock.calls;
        expect(call[0].embeds[0].data.description).toContain('Stopped');
    });

    it('does not throw when called while nothing is playing', async () => {
        // Both maps are empty – leaveVoiceChannel is a no-op and queue.delete is safe
        const interaction = makeInteraction(GUILD_ID);
        const cmd = makeCmd(StopCommand);
        await expect(cmd.stop(interaction)).resolves.not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PlayCommand – resolve() (private, exercised via casting)
// ─────────────────────────────────────────────────────────────────────────────

describe('PlayCommand – resolve()', () => {
    beforeEach(setupContainer);

    // ── Error conditions ──────────────────────────────────────────────────────

    it('throws when no Lavalink node is available', async () => {
        const { mockClient } = setupContainer();
        mockClient.musicPlayer.getIdealNode.mockReturnValue(null);
        const cmd = makeCmd(PlayCommand);
        await expect((cmd as any).resolve('some query')).rejects.toThrow('No Lavalink nodes are available.');
    });

    it('returns [] when the node returns a null result', async () => {
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue(null) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('https://www.youtube.com/watch?v=abc')).toEqual([]);
    });

    it('returns [] when loadType is "empty"', async () => {
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue({ loadType: 'empty' }) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('https://www.youtube.com/watch?v=abc')).toEqual([]);
    });

    it('returns [] when loadType is "error"', async () => {
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue({ loadType: 'error', data: { message: 'fail', severity: 'common', cause: '' } }) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('https://www.youtube.com/watch?v=abc')).toEqual([]);
    });

    // ── Successful resolution ─────────────────────────────────────────────────

    it('returns [track] for loadType "track"', async () => {
        const track = makeTrack('My Song');
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue({ loadType: 'track', data: track }) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('https://www.youtube.com/watch?v=abc')).toEqual([track]);
    });

    it('returns all playlist tracks for loadType "playlist"', async () => {
        const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C')];
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue({ loadType: 'playlist', data: { info: {}, tracks } }) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('https://www.youtube.com/playlist?list=PLabc')).toEqual(tracks);
    });

    it('returns search result data for loadType "search"', async () => {
        const tracks = [makeTrack('Result 1'), makeTrack('Result 2')];
        const { mockClient } = setupContainer();
        const node = { rest: { resolve: vi.fn().mockResolvedValue({ loadType: 'search', data: tracks }) } };
        mockClient.musicPlayer.getIdealNode.mockReturnValue(node);
        const cmd = makeCmd(PlayCommand);
        expect(await (cmd as any).resolve('never gonna give you up')).toEqual(tracks);
    });

    // ── Identifier construction ───────────────────────────────────────────────

    it('passes a plain-text query prefixed with "ytsearch:" to the node', async () => {
        const { mockClient } = setupContainer();
        const resolveFn = vi.fn().mockResolvedValue({ loadType: 'search', data: [] });
        mockClient.musicPlayer.getIdealNode.mockReturnValue({ rest: { resolve: resolveFn } });
        const cmd = makeCmd(PlayCommand);
        await (cmd as any).resolve('my search query');
        expect(resolveFn).toHaveBeenCalledWith('ytsearch:my search query');
    });

    it('passes a YouTube URL directly without modification', async () => {
        const { mockClient } = setupContainer();
        const resolveFn = vi.fn().mockResolvedValue({ loadType: 'track', data: makeTrack() });
        mockClient.musicPlayer.getIdealNode.mockReturnValue({ rest: { resolve: resolveFn } });
        const cmd = makeCmd(PlayCommand);
        await (cmd as any).resolve('https://www.youtube.com/watch?v=Fwp4VI7Dlmg');
        expect(resolveFn).toHaveBeenCalledWith('https://www.youtube.com/watch?v=Fwp4VI7Dlmg');
    });

    it('treats an http:// URL as a direct URL (no ytsearch: prefix)', async () => {
        const { mockClient } = setupContainer();
        const resolveFn = vi.fn().mockResolvedValue({ loadType: 'track', data: makeTrack() });
        mockClient.musicPlayer.getIdealNode.mockReturnValue({ rest: { resolve: resolveFn } });
        const cmd = makeCmd(PlayCommand);
        await (cmd as any).resolve('http://example.com/audio.mp3');
        expect(resolveFn).toHaveBeenCalledWith('http://example.com/audio.mp3');
    });
});
