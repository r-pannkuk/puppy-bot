const EnmapProvider = require('./core/EnmapProvider.js');

require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

let intents = new Discord.Intents(Discord.Intents.ALL);

/* Bot client creation. */
var client = new commando.Client({
    owner: process.env.OWNER,
    unknownCommandResponse: false,
    ws: { intents: intents }
});

/* Guild settings load. */
var provider = new EnmapProvider('global');
client.setProvider(provider).catch(console.error);

/* Command group registry. */
client.registry.registerGroups([
    ['admin', 'Admin Functions'],
    ['bet', 'Wagers and Placing Bets'],
    ['challonge', 'Links Discord Users with Challonge Accounts'],
    ['custom', 'Create Custom Commands for Posting Memes'],
    ['games', 'Commands for Games'],
    ['memes', 'Memes and Stupidity'],
    ['moderation', 'Moderates Users with Bans and Timeouts'],
    ['music', 'Music Player'],
    ['notes', 'User Notes'],
    ['pelt', 'PvP System for Abusing Scrubs'],
    ['points', 'A System for Betting and Awarding Points to Users'],
    ['reminders', 'Reminders and Notifications'],
    ['rng', 'Random Number Generators'],
    ['simulator', 'Simulate Responses From Certain People Using GPT-2'],
    ['tournament', 'Commands for Tournament Creation and Viewing'],
    ['traps', 'Trap Phrases Which Explode']
]);
client.registry.registerDefaultTypes();
client.registry.registerDefaultGroups();
client.registry.registerDefaultCommands({
    eval: false, 
    unknownCommand: false
});
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