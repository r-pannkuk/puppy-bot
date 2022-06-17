import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Client } from "discord.js";
import { ReminderManager } from "../../../lib/structures/managers/ReminderManager";

@ApplyOptions<Listener.Options>({
    once: true,
    event: Events.ClientReady
})
export class ReadyLoadGlobalSystems extends Listener<typeof Events.ClientReady> {
    public async run(client: Client) {
        client.reminders = new ReminderManager();
        await client.reminders.loadData();
    }
}

declare module 'discord.js' {
    export interface Client {
        reminders: ReminderManager
    }
}


// module.exports = function (client) {
//     client.provider.initGuild(client, 'global', () => {
//         /* ReminderManager added to bot. */
//         client.reminders = new ReminderManager(client);
//         client.reminders.scheduleAllReminders(client);

//         /* Notepad for user notes. */
//         client.notepad = new Notepad(client);

//     });
// }