const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetChannelRoleAssign extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-channel-roleassign',
            group: 'admin',
            memberName: 'set-channel-roleassign',
            description: 'Admin tool for setting a channel to update role assignments for users.',
            examples: [ '!set-channel-roleassign <channel>' ],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: Discord.Permissions.FLAGS.MANAGE_CHANNELS,
            args: [
                {
                    key: 'channel',
                    prompt: "Enter a channel name which will be monitored for role assignments.",
                    type: 'channel',
                    default: ''
                }
            ]
        });
    }

    
    async run(msg, { channel }) {
        if(channel !== '') {
            msg.guild.admin.roleChannelID = channel.id;
    
            msg.channel.send(`Role channel set successfully.  Reactions monitored in ${channel} will be used for role assignments.`);
        } else {
            var channel = this.client.channels.get(msg.guild.admin.roleChannelID);
            msg.channel.send(`Role assignment channel currently set to ${channel}.`);
        }

    }
}