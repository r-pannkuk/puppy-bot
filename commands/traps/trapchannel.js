const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class TrapChannelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'trapchannel',
            group: 'traps',
            memberName: 'trapchannel',
            description: 'Admin tool for setting a channel for posting trap messages.',
            examples: [ '!trapchannel <channel>' ],
            argsPromptLimit: 0,
            ownerOnly: true,
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
        if(!this.client.isOwner(msg.author)) {
            return;
        }

        if(channel !== '') {
            this.client.battleSystem.setTrapChannel(channel);
    
            msg.channel.send(`Trap channel set successfully.  Traps will now be posted in ${channel}`);
        } else {
            var channel = this.client.channels.get(this.client.battleSystem.getTrapChannel());
            msg.channel.send(`Trap channel currently set to ${channel}.`);
        }

    }
}