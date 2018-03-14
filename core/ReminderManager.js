const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');
const schedule = require('node-schedule');

module.exports = class ReminderManager {
    constructor(settings) {
        this._enmap = new Enmap({
            provider: new EnmapSQLite({
                name: settings.name
            })
        });
    }

    setReminder(user, pattern, callback) {
        var job = schedule.scheduleJob(pattern, callback());
    }
}