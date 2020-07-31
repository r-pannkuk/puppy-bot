const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetChannelAccounts extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-channel-accounts',
            group: 'admin',
            memberName: 'set-channel-accounts',
            description: 'Admin tool for setting a channel to update account assignments (such as Challonge) for users.',
            examples: ['!set-channel-accounts <channel>'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [{
                key: 'channel',
                prompt: "Enter a channel name which will be monitored for account assignments.",
                type: 'channel',
                default: ''
            }]
        });
    }

    async run(msg, { channel }) {
        if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        if (channel !== '') {
            msg.guild.admin.accountChannelID = channel.id;

            msg.channel.send(`Accounts channel set successfully.  Reactions monitored in ${channel} will be used for account approvals.`);
        } else {
            var channel = this.client.channels.cache.get(msg.guild.admin.accountChannelID);
            msg.channel.send(`Account assignment channel currently set to ${channel}.`);
        }

    }
}