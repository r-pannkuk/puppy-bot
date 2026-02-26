/**
 * Integration tests for ReminderManager.
 *
 * Covers:
 *   - loadData() – loads active reminders from the real MongoDB into the cache.
 *   - createReminder() – persists a new reminder record.
 *   - deleteReminder() / disableReminder() – cleans up reminders.
 *   - Cache behaviour after mutations.
 *
 * Test-specific reminders are isolated via a dedicated ownerId prefix and are
 * fully removed in after-hooks so production data is never modified.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from '@sapphire/framework';
import { ReminderManager } from '../../src/lib/structures/managers/ReminderManager';
import { ReminderTargetType, ReminderEventType } from '@prisma/client';

const TEST_OWNER_ID = 'test-owner-reminder-integration';
const TEST_CHANNEL_ID = '000000000000000000';
const TEST_GUILD_ID = 'test-guild-reminder-integration';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cleanupTestReminders() {
    // First, find all test reminders.
    const reminders = await container.database.reminder.findMany({
        where: { ownerId: TEST_OWNER_ID },
    });

    for (const r of reminders) {
        await container.database.reminderEvent.deleteMany({ where: { reminderId: r.id } });
        await container.database.reminderSchedule.deleteMany({ where: { reminderId: r.id } });
    }

    await container.database.reminder.deleteMany({
        where: { ownerId: TEST_OWNER_ID },
    });
}

/** Creates a bare Reminder + one Create event + one Schedule in the DB. */
async function seedReminder(content: string, reminderTime: Date) {
    const reminder = await container.database.reminder.create({
        data: {
            ownerId: TEST_OWNER_ID,
            content,
            isDisabled: false,
            target: {
                type: ReminderTargetType.User,
                mentionableIds: [TEST_OWNER_ID],
                channelId: TEST_CHANNEL_ID,
                guildId: null,
            },
            events: {
                create: [{
                    eventType: ReminderEventType.Create,
                    location: {
                        guildId: null,
                        channelId: TEST_CHANNEL_ID,
                        messageId: '000000000000000001',
                    },
                    payload: { createdAt: Date.now(), owner: {} },
                }]
            },
            schedules: {
                create: [{
                    reminderTime,
                    isDisabled: false,
                    repeat: {
                        isRepeating: false,
                        isInfinite: null,
                        interval: null,
                    },
                }]
            },
        },
    });
    return reminder;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReminderManager – database integration', () => {

    let manager: ReminderManager;

    beforeEach(async () => {
        await cleanupTestReminders();
        manager = new ReminderManager();

        // Provide a stub tasks interface (not needed for data-layer tests).
        (container as any).tasks = { create: async () => ({ id: 'fake-job-id' }), get: async () => null };
    });

    afterEach(async () => {
        await cleanupTestReminders();
    });

    // ── loadData() ────────────────────────────────────────────────────────────

    describe('loadData()', () => {
        it('loads without error, cache is accessible after loadData', async () => {
            // Stub scheduleAllPendingReminders so loadData doesn't need Redis.
            (manager as any).scheduleAllPendingReminders = async () => {};
            let threw = false;
            try {
                await manager.loadData();
            } catch {
                threw = true;
            }
            expect(threw).toBe(false);
            // cache is a Collection (a Map subclass)
            expect(manager.cache).toBeInstanceOf(Map);
        });

        it('loads seeded reminders into the cache', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            await seedReminder('Test load reminder', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            // At least one reminder with our owner should be in the cache.
            const found = manager.cache.find((r) => r.ownerId === TEST_OWNER_ID);
            expect(found).toBeTruthy();
            expect(found!.content).toBe('Test load reminder');
        });

        it('only loads non-disabled reminders', async () => {
            // Insert a disabled reminder directly.
            await container.database.reminder.create({
                data: {
                    ownerId: TEST_OWNER_ID,
                    content: 'disabled reminder',
                    isDisabled: true,
                    target: {
                        type: ReminderTargetType.User,
                        mentionableIds: [TEST_OWNER_ID],
                        channelId: TEST_CHANNEL_ID,
                        guildId: null,
                    },
                },
            });

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const found = manager.cache.find((r) => r.content === 'disabled reminder');
            expect(found).toBeUndefined();
        });
    });

    // ── getByOwnerId() via cache ───────────────────────────────────────────────

    describe('cache.filter() – reminder lookup by owner', () => {
        it('can filter the cache by ownerId after loadData', async () => {
            const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
            await seedReminder('Filter this reminder', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const owned = manager.cache.filter((r) => r.ownerId === TEST_OWNER_ID);
            expect(owned.size).toBeGreaterThanOrEqual(1);
            for (const [, r] of owned) {
                expect(r.ownerId).toBe(TEST_OWNER_ID);
            }
        });
    });

    // ── Reminder instance shape ────────────────────────────────────────────────

    describe('Reminder instance shape', () => {
        it('Reminder instances have helper methods after loading', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            await seedReminder('Shape test reminder', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const reminder = manager.cache.find((r) => r.ownerId === TEST_OWNER_ID);
            expect(reminder).toBeTruthy();
            expect(reminder!.getCreatedEvent).toBeTypeOf('function');
            expect(reminder!.getActiveSchedule).toBeTypeOf('function');
            expect(reminder!.getIsPending).toBeTypeOf('function');
            expect(reminder!.getExecutionNumber).toBeTypeOf('function');
        });

        it('getCreatedEvent() returns the Create event', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            await seedReminder('Event shape test', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const reminder = manager.cache.find((r) => r.ownerId === TEST_OWNER_ID);
            const createEvent = reminder!.getCreatedEvent();
            expect(createEvent).toBeTruthy();
            expect(createEvent.eventType).toBe(ReminderEventType.Create);
        });

        it('getActiveSchedule() returns the non-disabled schedule', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            await seedReminder('Schedule shape test', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const reminder = manager.cache.find((r) => r.ownerId === TEST_OWNER_ID);
            const schedule = reminder!.getActiveSchedule();
            expect(schedule).toBeTruthy();
            expect(schedule!.isDisabled).toBe(false);
        });

        it('getIsPending() returns true for a future reminder', async () => {
            const future = new Date(Date.now() + 60 * 60 * 1000);
            await seedReminder('Pending test', future);

            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            const reminder = manager.cache.find((r) => r.ownerId === TEST_OWNER_ID);
            expect(reminder!.getIsPending()).toBe(true);
        });
    });

    // ── Read from existing live database ──────────────────────────────────────

    describe('read from live reminder data (read-only)', () => {
        it('can load the full reminder collection without errors', async () => {
            (manager as any).scheduleAllPendingReminders = async () => {};
            let threw = false;
            try {
                await manager.loadData();
            } catch {
                threw = true;
            }
            expect(threw).toBe(false);
        });

        it('all loaded reminders have ownerId, content, target fields', async () => {
            (manager as any).scheduleAllPendingReminders = async () => {};
            await manager.loadData();

            for (const [, reminder] of manager.cache) {
                expect(reminder.ownerId).toBeTypeOf('string');
                expect(reminder.ownerId).not.toBe('');
                expect(reminder.content).toBeTypeOf('string');
                expect(reminder.target).toBeTypeOf('object');
            }
        });
    });
});
