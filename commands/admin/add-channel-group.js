const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class AddChannelGroup extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'add-channel-group',
            group: 'admin',
            memberName: 'add-channel-group',
            description: 'Creates a new group and role for discussion.',
            examples: [ '!set-channel-delete #channel' ],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: Discord.Permissions.FLAGS.MANAGE_CHANNELS,
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
            this.client.admin.setDeleteChannel(channel);
    
            msg.channel.send(`Deletion channel set to ${channel}.`);
        } else {
            var channel = this.client.channels.get(this.client.admin.getDeleteChannel());
            msg.channel.send(`Deletion channel currently set to ${channel}.`);
        }
    }

    
}