const Admin = require('./core/Admin.js');
const MusicPlayer = require('./core/MusicPlayer.js');
const BattleSystem = require('./core/BattleSystem.js');
const Notepad = require('./core/Notepad.js');
const ReminderManager = require('./core/ReminderManager.js');

require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Sqlite = require('sqlite');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

/* Bot client creation. */
var client = new commando.Client({
    owner: process.env.OWNER,
    unknownCommandResponse: false,
    disableEveryone: true
});

/* Guild settings load. */
client.setProvider(
    Sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db =>
    new commando.SQLiteProvider(db))
).catch(console.error);

/* Create a new battle system object. */
const battleSettings = require('./commands/pelt/settings.json');
client.battleSystem = new BattleSystem(battleSettings);

/* Admin system for server management. */
client.admin = new Admin({
    name: "Admin"
});

/* MusicPlayer added to bot. */
client.musicPlayer = new MusicPlayer({
    youtube: process.env.YOUTUBE
});

/* Notepad for user notes. */
client.notepad = new Notepad({
    name: "Notes"
});

/* ReminderManager added to bot. */
client.reminders = new ReminderManager({
    name: "Reminders"
});


/* Command group registry. */

client.registry.registerGroups([
    [ 'admin', 'Admin functions.' ],
    [ 'rng', 'Random Number Generators' ],
    [ 'pelt', 'PvP System for Abusing Scrubs' ],
    [ 'traps', 'Set trap phrases that explode when players say them in chat.' ],
    [ 'memes', 'Memes and Stupidity' ],
    [ 'music', 'General music player for Youtube and Soundcloud' ],
    [ 'reminders', 'Set reminders and notifications for yourself.' ],
    [ 'notes', 'Notes that can be set or reclaimed at any time.' ]
]);
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + '/commands');



/* Setting up message listeners for callback messages */
var messageListenerDirectory = path.join(__dirname, "eventListeners");
var callbacks = {};

fs.readdirSync(messageListenerDirectory).forEach((eventDir) => {
    callbacks[eventDir] = [];

    eventListenerPath = path.join(messageListenerDirectory, eventDir);

    fs.readdirSync(eventListenerPath).forEach(listener => {
        var eventListener = path.join(eventListenerPath, listener);
        callbacks[eventDir].push(require(eventListener));
    });
});

Object.keys(callbacks).forEach(event => {
    callbacks[event].forEach((listener) => {
        client.on(event, (...args) => {
            listener(client, ...args);
        });
    });
});

/* Startup */

client.login(process.env.TOKEN);
