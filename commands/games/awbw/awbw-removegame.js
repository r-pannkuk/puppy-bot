const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWRemoveGame extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-removegame',
            group: 'games',
            memberName: 'awbw-removegame',
            description: `Remove games for tracking.`,
            argsPromptLimit: 0,
            aliases: ['awbw-remove-game', 'awbw-game-remove'],
            examples: [ '!awbw-removegame <gameId>', '!awbw-removegame <gameId1> <gameId2>' ],
            args: [
                {
                    key: 'gameIds',
                    prompt: `Enter any game ID's to remove tracking for.`,
                    infinite: true,
                    type: 'string'
                }
            ]
        });
    }

    
    async run(message, { gameIds }) {
        var removedGames = message.guild.AWBW.removeGames(gameIds);

        message.channel.send("Removed the games from AWBW tracking:\n" + removedGames.join('\n'));
    }
}