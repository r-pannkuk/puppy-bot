const Admin = require('../../core/Admin.js');
const MusicPlayer = require('../../core/MusicPlayer.js');
const BattleSystem = require('../../core/BattleSystem.js');
const Notepad = require('../../core/Notepad.js');
const ReminderManager = require('../../core/ReminderManager.js');
const GameManager = require('../../core/GameManager.js');
const Challonge = require('../../core/Challonge.js');
const PointSystem = require('../../core/Points.js');

module.exports = function(client, guild) {

    client.provider.initGuild(client, guild, () => {
        /* Create a new battle system object. */
        guild.battleSystem = new BattleSystem(guild.settings);

        /* Admin system for server management. */
        guild.admin = new Admin(guild.settings);

        /* MusicPlayer added to bot. */
        guild.musicPlayer = new MusicPlayer(guild.settings, {
            youtube: process.env.YOUTUBE
        });

        /* Betting system for awarding users. */
        guild.pointSystem = new PointSystem(guild.settings);

        /* Challonge manager added to bot. */
        guild.challonge = new Challonge(guild.settings, {
            apiKey: process.env.CHALLONGE
        });

        /* Notepad for user notes. */
        // guild.notepad = new Notepad(guild.settings);

        /* ReminderManager added to bot. */
        // guild.reminders = new ReminderManager(guild.settings);

        /* Game manager for managing game keys and settings. */
        guild.gameManager = new GameManager(guild.settings);
    });
}