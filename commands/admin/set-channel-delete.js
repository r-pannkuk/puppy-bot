const commando = require('discord.js-commando');
const Discord = require('discord.js');
const moment = require('moment');


module.exports = class SetChannelDelete extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-channel-delete',
            group: 'admin',
            memberName: 'set-channel-delete',
            description: 'Stores a text channel for reporting deleted messages.',
            examples: [ '!set-channel-delete #channel' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: "Store a channel for use.",
                    type: 'channel',
                    default: ''
                }
            ]
        });
    }

    
    async run(msg, { channel }) {
        if(channel !== '') {
            msg.guild.admin.deleteChannelID = channel.id;
    
            msg.channel.send(`Deletion channel set to ${channel}.`);
        } else {
            var channel = this.client.channels.get(msg.guild.admin.deleteChannelID);
            msg.channel.send(`Deletion channel currently set to ${channel}.`);
        }
    }

    
}