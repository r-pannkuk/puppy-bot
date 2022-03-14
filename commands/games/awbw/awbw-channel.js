const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWChannel extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-channel',
            group: 'games',
            memberName: 'awbw-channel',
            description: `Sets the output channel.`,
            argsPromptLimit: 0,
            examples: ['!awbw-channel', '!awbw-channel <channel>'],
            args: [
                {
                    key: 'channel',
                    prompt: `Enter the channel where notifications will be updated.`,
                    type: 'channel',
                    default: ''
                }
            ]
        });
    }


    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} obj
     * @param {Discord.TextChannel} obj.channel 
     */
    async run(message, { channel }) {
        if(channel !== "") {
            message.guild.outputChannelID = channel.id;
        }
        message.channel.send(`AWBW channel set to ${message.guild.channels.get(message.guild.AWBW.outputChannelID)}`)
    }
}