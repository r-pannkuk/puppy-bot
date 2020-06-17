const Discord = require('discord.js');
const Scheduler = require('node-schedule');

const Reminder = require('./Reminder.js');
const RichEmbedHelper = require('./RichEmbedBuilder.js');
const TimeExtract = require('./TimeExtract.js');

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

    /**
     * Creates a new reminder and stores it in the database.
     * @param {Reminder} obj An object representing a reminder
     */
    createReminder(obj) {
        var r = new Reminder(obj);
        r.scheduleName = r.author + '_' + r.target + '_reminder_' + r.id;
        r.originalReminderTime = r.reminderTime;
        r.isEnabled = true;

        var temp = this.reminders;
        temp[r.id] = r;

        this.reminders = temp;

        return r;
    }

    /**
     * Fetches a reminder, either from an object containing an ID or an ID itself.
     * @param {*} obj Either an object containing an id, or a reminder id alone.
     */
    getReminder(obj) {
        return this.reminders[obj.id || obj];
    }

    /**
     * Fetches a reminder by the given message ID for the reacted message. 
     * @param {*} messageId The ID of the message that was reacted to.
     */
    getReminderByMessageId(messageId) {
        return Object.values(this.reminders).find(r => r.discordMessageId === messageId);
    }

    /**
     * Fires off a reminder to the designated target, and increments tracking variables.
     * @param {*} client 
     * @param {*} reminder 
     */
    async scheduleReminder(client, r) {
        Scheduler.scheduleJob(r.scheduleName, r.reminderTime, this.scheduleReminderJob.bind(this, client, r));
    }

    async scheduleReminderJob(client, r) {
        var temp = this.reminders;
        var currentReminder = temp[r.id];

        if (currentReminder.isEnabled === false) {
            return;
        }

        currentReminder.executionNumber++;
        currentReminder.isFired = true;

        if (currentReminder.isRepeat) {
            currentReminder.reminderTime = Date.now() + currentReminder.repeatInterval;
            Scheduler.cancelJob(currentReminder.scheduleName);
            this.scheduleReminder(client, currentReminder);
        }

        temp[currentReminder.id] = currentReminder;
        this.reminders = temp;

        var newMessage = await RichEmbedHelper.create(client, currentReminder);
        this.subscribeReminderMessage(currentReminder, newMessage.id);
    }

    /**
     * Enables a reminder for use, so that it will remind the target at the given schedule.
     * @param {*} obj Either an object containing an id, or a reminder id alone.
     * @param {*} client The client to fire the reminder with. 
     */
    enableReminder(obj) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        r.isEnabled = true;

        temp[r.id] = r;
        this.reminders = temp;

        return r;
    }

    subscribeReminderMessage(obj, discordMessage) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        r.discordGuildId = (discordMessage.guild) ? discordMessage.guild.id : '@me';
        r.discordChannelId = discordMessage.channel.id;
        r.discordMessageId = discordMessage.id;

        temp[r.id] = r;
        this.reminders = temp;
    }

    setReminderNextRepeat(obj, timeExtract) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        r.reminderTime = new Date(r.reminderTime);
        r.repeatInterval = timeExtract.interval();

        if (timeExtract.process_type === TimeExtract.Types.EXPLICIT) {
            r.reminderTime = timeExtract.extract();
        } else if (timeExtract.process_type === TimeExtract.Types.DISPLACEMENT) {
            while (r.reminderTime < Date.now() + 1000) {
                r.reminderTime.setTime(r.reminderTime.getTime() + r.repeatInterval);
            }
        }

        temp[r.id] = r;
        this.reminders = temp;

        return r;
    }

    scheduleAllReminders(client) {
        for (var i in this.reminders) {
            var reminder = this.reminders[i];

            if (reminder.isEnabled) {
                this.scheduleReminder(client, reminder);
            }
        }
    }

    cancelReminder(obj) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        r.isEnabled = false;
        r.isRepeat = false;
        // Scheduler.cancelJob(r.scheduleName);

        temp[r.id] = r;
        this.reminders = temp;
    }

    repeatOnce(obj, timeExtract) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        if (!r.isEnabled) {
            return;
        }

        if (!timeExtract || timeExtract.interval() <= 0) {
            return;
        }

        r = this.setReminderNextRepeat(r, timeExtract);

        if (Object.keys(Scheduler.scheduledJobs).indexOf(r.scheduleName) > -1) {
            Scheduler.rescheduleJob(r.scheduleName, r.reminderTime);
        } else {
            console.log("Something went wrong.  No reminder found.");
        }

        temp[r.id] = r;
        this.reminderes = temp;
    }

    repeat(obj, interval) {
        var temp = this.reminders;
        var r = temp[obj.id || obj];

        r.isRepeat = true;

        temp[r.id] = r;
        this.reminders = temp;

        this.repeatOnce(r, interval);
    }

    /**
     * Deletes a reminder from use and prevents it from firing.
     * @param {*} obj Either an object containing an id, or a reminder id alone.
     */
    deleteReminder(obj) {
        var temp = this.reminders;
        // TODO: Disable the reminder from the job list. 
        delete temp[obj.id || obj];
        this.reminders = temp;
    }
};