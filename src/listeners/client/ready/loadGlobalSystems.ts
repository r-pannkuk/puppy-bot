import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Client } from "discord.js";
import { ReminderManager } from "../../../lib/structures/managers/ReminderManager";

/**
 * Fired once on {@link Events.ClientReady}.
 *
 * Initializes the global {@link ReminderManager}, loads all active reminders
 * from MongoDB into the in-memory cache, and re-queues any pending jobs
 * into the Redis/Bull scheduler so that reminders survive bot restarts.
 */
@ApplyOptions<Listener.Options>({
    once: true,
    event: Events.ClientReady
})
export class ReadyLoadGlobalSystems extends Listener<typeof Events.ClientReady> {
    public async run(client: Client) {
        client.reminders = new ReminderManager();
        // loadData() also calls scheduleAllPendingReminders() to restore
        // any jobs that were dropped when the process restarted.
        try {
            await client.reminders.loadData();
        } catch (error) {
            this.container.logger.error('[ReadyLoadGlobalSystems] Failed to load reminder data:', error);
        }
    }
}
// Client augmentation is declared in src/lib/types/augments.d.ts