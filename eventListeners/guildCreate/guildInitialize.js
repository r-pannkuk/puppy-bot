const Admin = require('../../core/Admin.js');
const MusicPlayer = require('../../core/music/MusicPlayer.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const Notepad = require('../../core/notes/Notepad.js');
const GameManager = require('../../core/GameManager.js');
const Challonge = require('../../core/challonge/Challonge.js');
const PointSystem = require('../../core/points/Points.js');
const ModerationSystem = require('../../core/moderation/ModerationSystem.js');
const CustomManager = require('../../core/custom/CustomManager.js');
const GuildMessageCache = require('../../core/scraping/GuildMessageCache.js');

module.exports = function(client, guild) {

    client.provider.initGuild(client, guild, async () => {
        /* Create a new battle system object. */
        guild.battleSystem = new BattleSystem(guild.settings);

        /* Admin system for server management. */
        guild.admin = new Admin(guild.settings);

        /* MusicPlayer added to bot. */
        guild.musicPlayer = new MusicPlayer(guild.settings, {
            youtube: process.env.YOUTUBE,
            soundcloud: process.env.SOUNDCLOUD
        });

        /* Betting system for awarding users. */
        guild.pointSystem = new PointSystem(guild.settings);

        /* Challonge manager added to bot. */
        guild.challonge = new Challonge(guild.settings, {
            apiKey: process.env.CHALLONGE
        });

        /* Moderation system for managing user activity. */
        guild.moderation = new ModerationSystem(guild.settings);
        guild.moderation.scheduleAllModerations();

        /* Custom command system unique to each guild. */
        guild.customManager = new CustomManager(guild.settings);
        guild.customManager.registerCustomCommands();

        /* Guild message cache for tracking user stats and simulations. */
        guild.messageCache = new GuildMessageCache(guild.settings);
        guild.messageCache.init();

        /* Notepad for user notes. */
        guild.notepad = new Notepad(guild.settings);

        /* Game manager for managing game keys and settings. */
        guild.gameManager = new GameManager(guild.settings);

        /* AWBW tracker and poller. */
        let AdvanceWarsByWeb = (await import('../../core/games/AdvanceWarsByWeb.mjs')).default;
        guild.AWBW = new AdvanceWarsByWeb(guild.settings);
    });
}