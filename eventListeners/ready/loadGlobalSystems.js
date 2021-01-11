const Admin = require('../../core/Admin.js');
const MusicPlayer = require('../../core/music/MusicPlayer.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const Notepad = require('../../core/notes/Notepad.js');
const ReminderManager = require('../../core/reminders/ReminderManager.js');
const ReminderMessageEmbed = require('../../core/reminders/EmbedBuilder.js');
const GameManager = require('../../core/GameManager.js');
const Challonge = require('../../core/challonge/Challonge.js');
const PointSystem = require('../../core/points/Points.js');

module.exports = function(client) {
    client.provider.initGuild(client, 'global', () => {
        /* ReminderManager added to bot. */
        client.reminders = new ReminderManager(client);
        client.reminders.scheduleAllReminders(client);

        /* Notepad for user notes. */
        client.notepad = new Notepad(client);
        
    });
}