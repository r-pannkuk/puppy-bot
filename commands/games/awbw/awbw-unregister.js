const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWUnregister extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-unregister',
            group: 'games',
            memberName: 'awbw-unregister',
            description: `Unregister a Discord User from AWBW.`,
            argsPromptLimit: 0,
            examples: [ '!awbw-register' ],
            args: [
                {
                    key: 'users',
                    prompt: `Enter a Discord User's name to unregister them from the list`,
                    infinite: true,
                    type: 'member'
                }
            ]
        });
    }

    
    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} obj
     * @param {Discord.Member[]} obj.users
     */
    async run(message, { users }) {
        var removedUsers = message.guild.AWBW.removeDiscordUsers(users.map(u => u.id));
        removedUsers = removedUsers.map(u => message.guild.members.cache.get(u));

        message.channel.send("Removed the users from AWBW tracking:\n" + users.join('\n'));
    }
}