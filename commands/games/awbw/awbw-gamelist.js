const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWGameList extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-gamelist',
            group: 'games',
            memberName: 'awbw-gamelist',
            description: `Display all of the games that are currently being tracked.`,
            argsPromptLimit: 0,
            examples: [ '!awbw-gamelist' ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        var games = message.guild.AWBW.games;

        var gamesArray = [];

        for(var gameId in games) {
            var game = games[gameId];
            var name = game["name"] || gameId;
            gamesArray.push(`[${name}](https://awbw.amarriner.com/2030.php?games_id=${gameId}): ${game["currentUser"] || "Not yet tracked."}`);
        }

        /** @type {Discord.MessageEmbed} */
        var richEmbed = new Discord.MessageEmbed();
        richEmbed.setTitle("Currently Tracked AWBW Games");
        richEmbed.setDescription(gamesArray.join('\n'));

        await message.channel.send(richEmbed);
    }
}