const EnmapProvider = require('./core/EnmapProvider.js');

require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

/* Bot client creation. */
var client = new commando.Client({
    owner: process.env.OWNER,
    unknownCommandResponse: false
});

/* Guild settings load. */
var provider = new EnmapProvider('global');
client.setProvider(provider).catch(console.error);

/* Command group registry. */
client.registry.registerGroups([
    [ 'admin', 'Admin Functions' ],
    [ 'challonge', 'Links discord users with challonge accounts.'],
    [ 'games', 'Commands for Games' ],
    [ 'memes', 'Memes and Stupidity' ],
    [ 'music', 'Music Player' ],
    [ 'notes', 'User Notes' ],
    [ 'pelt', 'PvP System for Abusing Scrubs' ],
    [ 'points', 'A system for betting and awarding points for users.'],
    [ 'reminders', 'Reminders and Notifications' ],
    [ 'rng', 'Random Number Generators' ],
    [ 'tournament', 'Commands for tournament creation and viewing'],
    [ 'traps', 'Trap Phrases which Explode' ]
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
