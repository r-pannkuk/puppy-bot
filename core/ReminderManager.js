const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
const schedule = require('node-schedule');

module.exports = class ReminderManager {
    constructor(guildSettings) {
        this.guildSettings = guildSettings;
    }

    setReminder(user, pattern, callback) {
        var job = schedule.scheduleJob(pattern, callback());
    }
}