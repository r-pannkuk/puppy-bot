const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWAddGame extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-addgame',
            group: 'games',
            memberName: 'awbw-addgame',
            description: `Add a game ID for tracking turns.`,
            argsPromptLimit: 0,
            aliases: ['awbw-add-game', 'awbw-game-add'],
            examples: [ '!awbw-register' ],
            args: [
                {
                    key: 'gameIds',
                    prompt: `Enter any game ID's to track turns for.`,
                    infinite: true,
                    type: 'string'
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} obj 
     * @param {string[]} obj.gameIds
     */
    async run(message, { gameIds }) {
        message.guild.AWBW.addGames(gameIds);

        var response = "The following games were added to tracking:";
        response += gameIds.join('\n');

        message.channel.send(response);
    }
}