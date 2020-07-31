const commando = require('discord.js-commando');
const Discord = require('discord.js');

const GameKeys = require('../../../core/games/GameKeys.js');

module.exports = class MHWHost extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'mhw-host',
            group: 'games',
            memberName: 'mhw-host',
            aliases: [ 'mhwhost', 'mh-host', 'mhhost', 'hostmh', 'host mh', 'host mhw' ],
            description: 'Applies a new Monster Hunter World host.',
            guildOnly: true,
            examples: [ '!mhw-host <room key>', 
                '!mhw-host <room key> <message>' ],
            args: [
                {
                    key: 'roomKey',
                    prompt: "The Monster Hunter World session ID",
                    type: 'string',
                    default: ''
                },
                {
                    key: 'roomMessage',
                    prompt: "An optional message for the hosted game.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    
    async run(message, {roomKey, roomMessage}) {
        var guild = message.guild;
        var currentHost = guild.gameManager.get(GameKeys.MonsterHunterWorld, message.author.id, 'host');

        // Respond to the user with their current host if available.
        if(roomKey === '') {

            if(currentHost !== undefined) {
                message.channel.send(`Found ${message.author}'s host game: **${currentHost.roomKey}** (${currentHost.timestamp})`);
            } else {
                message.channel.send(`No host game found for ${message.author}.`);
            }
        }
        else {

            var hostChannel = guild.channels.cache.get(guild.gameManager.get(GameKeys.MonsterHunterWorld, null, 'hostChannelID'));

            if(hostChannel === undefined) {
                hostChannel = message.channel;
            }
            else if(currentHost !== undefined) {
                var hostObj = guild.gameManager.get(GameKeys.MonsterHunterWorld, message.author.id, 'host');
                var hostMessage = hostChannel.messages.fetch(hostObj.sentMessageID).then(msg => msg.delete());
            }

            var user = message.author;

            hostChannel.send(`${message.author}'s Host: ${roomKey} ${roomMessage === '' ? '' : '(' + roomMessage + ')'}`).then((message) => {
                var hostObj = {
                    user: user.id,
                    roomKey: roomKey,
                    roomMessage: roomMessage,
                    sentMessageID: message.id,
                    timestamp: Date.now()
                };

                guild.gameManager.set(GameKeys.MonsterHunterWorld, user.id, 'host', hostObj);
            });
        }
    }
}