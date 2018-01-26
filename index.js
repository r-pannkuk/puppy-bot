const MusicPlayer = require('./core/MusicPlayer.js');
const BattleSystem = require('./core/BattleSystem.js');

require('dotenv').config();

const Discord = require('discord.js');
const commando = require('discord.js-commando');
const path = require('path');
const Sqlite = require('sqlite');

/* Bot client creation. */
const client = new commando.Client({
    owner: process.env.USER,
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

client.on('message', (message) => {
    if(message.author !== client.user) {
        client.battleSystem.checkForTraps(message);
    }
});

/* MusicPlayer added to bot. */
client.musicPlayer = new MusicPlayer({
    youtube: process.env.YOUTUBE
});

/* Command group registry. */

client.registry.registerGroups([
    [ 'rng', 'Random Number Generators' ],
    [ 'pelt', 'PvP System for Abusing Scrubs' ],
    [ 'memes', 'Memes and Stupidity' ],
    [ 'music', 'General music player for Youtube and Soundcloud' ]
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
