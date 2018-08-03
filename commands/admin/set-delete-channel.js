const commando = require('discord.js-commando');
const Discord = require('discord.js');
const moment = require('moment');


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
        if(channel !== null) {
            client.removeAllListeners('messageDelete');
            client.on('messageDelete', (message) => {
                if(message.author !== client.user && message.content.indexOf("!trap") !== 0) {  
                    var createdDate = new Date(message.createdTimestamp);
                    var m = moment.tz(createdDate, 'America/New_York');
                    channel.send(`(${m.format('YYYY-MM-DD h:mm:ss a')}) Deleted message from **${message.author.username}** [${message.channel}]:\n${message.content}`);
                }
                
            });
            
            message.channel.send(`Deletion channel set to ${channel}.`);
        }
        else {
            console.log('channel not found');
        }


    }
}