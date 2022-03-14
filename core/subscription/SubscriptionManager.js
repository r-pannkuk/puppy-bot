import {default as Discord } from 'discord.js';
import { default as commando } from 'discord.js-commando';

const CreateReminderResponse = {
    OK: 0,
    LONG_TIME: 1,
    LONG_INTERVAL: 2,
    SHORT_INTERVAL: 3,
    INVALID_TAG: 5,
    PAST_TIME: 6
};

module.exports = class ReminderManager {
    constructor(client) {
        if (client.provider.get('global', 'reminder') === undefined) {
            console.log("Reminder settings not found, creating.");
            client.provider.set('global', 'reminder', {});
        }

        this._provider = client.provider;
    }

    get reminders() { return this._provider.get('global', 'reminder'); }
    set reminders(obj) { this._provider.set('global', 'reminder', obj); }
}