const Admin = require('../../core/Admin.js');
const MusicPlayer = require('../../core/MusicPlayer.js');
const BattleSystem = require('../../core/BattleSystem.js');
const Notepad = require('../../core/Notepad.js');
const ReminderManager = require('../../core/reminders/ReminderManager.js');
const ReminderRichEmbed = require('../../core/reminders/RichEmbedBuilder.js');
const GameManager = require('../../core/GameManager.js');
const Challonge = require('../../core/challonge/Challonge.js');
const PointSystem = require('../../core/points/Points.js');

module.exports = function(client) {
    client.provider.initGuild(client, 'global', () => {
        /* ReminderManager added to bot. */
        client.reminders = new ReminderManager(client);
        client.reminders.scheduleAllReminders(client);
    });
}