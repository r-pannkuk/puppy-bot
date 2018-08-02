const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetDeleteChannel extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-delete-channel',
            group: 'admin',
            memberName: 'set-delete-channel',
            description: 'Stores a text channel for reporting deleted messages.',
            examples: [ '!set-delete-channel #channel' ],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: Discord.Permissions.FLAGS.MANAGE_CHANNELS,
            args: [
                {
                    key: 'channel',
                    prompt: "Store a channel for use.",
                    type: 'channel'
                }
            ]
        });
    }

    
    async run(message, { channel }) {
        var client = this.client;

        client.on('messageDelete', (message) => {
            if(message.author !== client.user) {

                if(channel !== null) {
                    var embed = new Discord.RichEmbed();
                    embed.setAuthor(message.author.username, message.author.displayAvatarURL);
                    embed.setTitle(`#${message.channel.name}`)
                    embed.setTimestamp(message.timestamp);
                    embed.setDescription(message.content);
                    channel.send(embed);
                }
                else {
                    console.log('channel not found');
                }
            }
        });

        message.channel.send(`Deletion channel set to ${channel}.`);
    }
}