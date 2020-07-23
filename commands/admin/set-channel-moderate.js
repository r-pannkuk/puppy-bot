const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetChannelModeration extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-channel-moderation',
            group: 'admin',
            memberName: 'set-channel-moderation',
            description: 'Admin tool for setting a channel for user moderation.',
            examples: ['!set-channel-moderation <channel>'],
            argsPromptLimit: 0,
            aliases: ['set-channel-gulag', 'set-channel-moderate'],
            guildOnly: true,
            userPermissions: [Discord.Permissions.FLAGS.ADMINISTRATOR],
            args: [{
                key: 'channel',
                prompt: "Enter a channel name which will be designated for user moderation.",
                type: 'channel',
                default: ''
            }]
        });
    }

    async run(msg, { channel }) {
        if (channel !== '') {
            msg.guild.admin.moderationChannelID = channel.id;

            msg.channel.send(`Moderation channel set successfully.  Users will be placed in ${channel} upon use of the !moderate/!gulag command.`);
        } else {
            var channel = this.client.channels.get(msg.guild.admin.moderationChannelID);
            msg.channel.send(`Moderation channel currently set to ${channel}.`);
        }

    }
}