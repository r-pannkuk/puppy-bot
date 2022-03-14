const commando = require('discord.js-commando');
const Discord = require('discord.js');
const request = require('request-promise-native');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class AWBWUserList extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'awbw-userlist',
            group: 'games',
            memberName: 'awbw-userlist',
            description: `Display all of the games that are currently being tracked.`,
            argsPromptLimit: 0,
            examples: [ '!awbw-userlist' ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        var users = message.guild.AWBW.users;

        var userArray = [];

        for(var discordId in users) {
            var discordUser = await message.guild.members.cache.get(discordId);
            userArray.push(`${discordUser}: ${users[discordId]}`);
        }

        /** @type {Discord.MessageEmbed} */
        var richEmbed = new Discord.MessageEmbed();
        richEmbed.setTitle("Registered AWBW Users");
        richEmbed.setDescription(userArray.join('\n'));

        await message.channel.send(richEmbed);
    }
}