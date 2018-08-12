const commando = require('discord.js-commando');
const Discord = require('discord.js');

const GameKeys = require('../GameKeys.js');

module.exports = class MHWUnhost extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'mhw-unhost',
            group: 'games',
            memberName: 'mhw-unhost',
            description: 'Unhosts a channel set for a user.',
            guildOnly: true,
            examples: [ '!unhost' ]
        });
    }

    
    async run(message) {
        var guild = message.guild;

        var currentHost = guild.gameManager.get(GameKeys.MonsterHunterWorld, message.author.id, 'host');

        if(currentHost !== undefined) {

            var hostChannel = guild.channels.get(guild.gameManager.get(GameKeys.MonsterHunterWorld, null, 'hostChannelID'));

            if(hostChannel !== undefined) {
                var hostObj = guild.gameManager.get(GameKeys.MonsterHunterWorld, message.author.id, 'host');
                var hostMessage = hostChannel.fetchMessage(hostObj.sentMessageID).then(msg => msg.delete());
            }

            guild.gameManager.delete(GameKeys.MonsterHunterWorld, message.author.id, 'host');

            message.channel.send(`Unhosted ${message.author}'s game.`);
        } else {
            message.channel.send(`No host game found for ${message.author}.`);
        }
    }
}