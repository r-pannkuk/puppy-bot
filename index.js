const EnmapProvider = require('./core/EnmapProvider.js');

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
client.setProvider(new EnmapProvider(path.join(__dirname, 'settings.sqlite3'))).catch(console.error);

/* Command group registry. */

client.registry.registerGroups([
    [ 'admin', 'Admin Functions' ],
    [ 'rng', 'Random Number Generators' ],
    [ 'pelt', 'PvP System for Abusing Scrubs' ],
    [ 'traps', 'Trap Phrases which Explode' ],
    [ 'memes', 'Memes and Stupidity' ],
    [ 'music', 'Music Player' ],
    [ 'reminders', 'Reminders and Notifications' ],
    [ 'notes', 'User Notes' ],
    [ 'games', 'Commands for Games' ]
]);
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + '/commands');
client.registry.registerCommandsIn(__dirname + '/commands/games');


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
