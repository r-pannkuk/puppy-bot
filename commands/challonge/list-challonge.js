const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = class ListChallonge extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'list-challonge',
            group: 'challonge',
            memberName: 'list-challonge',
            aliases: ['list-c', 'lc', 'listchallonge', 'listc'],
            description: 'Lists all associated challonge accounts which have not been approved.',
            examples: ['!list-challonge'],
            argsPromptLimit: 0,
            guildOnly: true
        });
    }

    async run(message) {
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
            message.guild.pointSystem.adminRoles.find(r => message.guild.member(message.user).roles.has(r));

        if (!bool) {
            message.reply("You need to have role permissions to use that command.");
            return;
        }

        var pointSystem = message.guild.pointSystem;

        var userAccounts = pointSystem.getAllUserAccounts();

        var pendingAccounts = {};

        for (var user in userAccounts) {
            for (var i in userAccounts[user]) {
                var account = userAccounts[user][i];

                if (account._service !== Account.SERVICE.Challonge) {
                    continue;
                }

                if (account._status !== Account.STATUS.Pending) {
                    continue;
                }

                var accountsChannelId = message.guild.admin.accountChannelID;
                var confirmationMessage = await message.guild.channels.get(accountsChannelId).fetchMessage(account._confirmationMessageId);

                pendingAccounts[message.guild.members.get(user).displayName] = RichEmbedBuilder.discordLink(
                    confirmationMessage.guild,
                    confirmationMessage.channel,
                    confirmationMessage
                );
            }
        }

        if(Object.keys(pendingAccounts).length === 0) {
            message.channel.send(`No pending user accounts were found.`);
            return;
        }

        var embed = RichEmbedBuilder.listPendingAccounts(pendingAccounts);

        message.author.send(embed);
        message.channel.send(`List of pending users sent to ${message.author}.`);
    }
}