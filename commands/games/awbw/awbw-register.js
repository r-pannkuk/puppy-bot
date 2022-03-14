const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWRegister extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-register',
            group: 'games',
            memberName: 'awbw-register',
            description: `Register a Discord User with an AWBW user.`,
            argsPromptLimit: 0,
            examples: [ '!awbw-register' ],
            args: [
                {
                    key: 'userId',
                    prompt: `Enter the user ID from awbw that you want to register yourself for.`,
                    type: 'string'
                },
                {
                    key: 'user',
                    prompt: `Enter the user you want to add for tracking.`,
                    type: 'member',
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} obj
     * @param {string} obj.userId 
     * @param {Discord.Member} obj.user
     */
    async run(message, { userId, user }) {
        if(member === '') {
            member = message.author;
        }

        message.guild.AWBW.addUser(user.id, userId);

        await message.channel.send(`Added user ${userId} under ${user.displayName}.`)
    }
}