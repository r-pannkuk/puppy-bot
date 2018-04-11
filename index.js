const MusicPlayer = require('./core/MusicPlayer.js');
const BattleSystem = require('./core/BattleSystem.js');
const Notepad = require('./core/Notepad.js');
const ReminderManager = require('./core/ReminderManager.js');

require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const path = require('path');
const Sqlite = require('sqlite');

/* Bot client creation. */
const client = new commando.Client({
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


/* Message callbacks for follow-up commands. */
client.messageCallbacks = [
    client.battleSystem.checkForTraps.bind(client.battleSystem),
    (message) => { console.log(`Is ${message.author.username} owner: ${client.isOwner(message.author).toString()}`)}
];

client.on('message', (message) => {
    if(message.author !== client.user) {
        for(var i in client.messageCallbacks) {
            client.messageCallbacks[i](message);
        }
    }
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

/* Startup */

client.on('ready', () => {
    client.user.setPresence({
        status: 'online',
        game: {
            name: 'Woof!',
            type: 'LISTENING'
        }
    });
});

client.login(process.env.TOKEN);
