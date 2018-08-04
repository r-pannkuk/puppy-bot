const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class TrapChannelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-channel-trap',
            group: 'admin',
            memberName: 'set-channel-trap',
            description: 'Admin tool for setting a channel for posting trap messages.',
            examples: [ '!set-channel-trap <channel>' ],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: Discord.Permissions.FLAGS.MANAGE_CHANNELS,
            args: [
                {
                    key: 'channel',
                    prompt: "Enter a channel name for posting trap messages.",
                    type: 'channel',
                    default: ''
                }
            ]
        });
    }

    
    async run(msg, { channel }) {
        if(channel !== '') {
            this.client.admin.setTrapChannel(channel);
    
            msg.channel.send(`Trap channel set successfully.  Traps will now be posted in ${channel}`);
        } else {
            var channel = this.client.channels.get(this.client.admin.getTrapChannel());
            msg.channel.send(`Trap channel currently set to ${channel}.`);
        }

    }
}