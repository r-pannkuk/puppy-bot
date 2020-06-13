const Discord = require('discord.js');
const emojis = require('../../core/bet/Emojis.js');
const Account = require('../../core/points/Account.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    if (message.guild === undefined || message.guild === null) {
        return;
    }

    if (channel.type !== 'text') {
        return;
    }

    if (user === client.user) {
        return;
    }

    if (emoji.name !== '✅' && emoji.name !== '🚫') {
        return;
    }

    var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
        message.guild.pointSystem.adminRoles.find(r => message.guild.member(user).roles.has(r));

    if (bool) {

        var account = message.guild.pointSystem.findAccountByMessage(message.id);

        if (!account || account._status !== Account.STATUS.Pending) {
            return;
        }

        var accountOwner = message.guild.pointSystem.getUserByAccount(account);
        var accountOwnerDiscordUser = message.guild.members.find(a => a.id = accountOwner._id).user;

        await message.clearReactions();

        var embed = message.embeds[0];

        if (emoji.name === '✅') {

            account._status = Account.STATUS.Approved;
            message.guild.pointSystem.setUserAccount(accountOwnerDiscordUser, account);

            var updatedUser = message.guild.pointSystem.getUser(accountOwnerDiscordUser);
            embed = RichEmbedBuilder.userAccount({
                user: updatedUser,
                serviceType: account._service,
                embed: new Discord.RichEmbed()
                    .setAuthor(accountOwnerDiscordUser.username, accountOwnerDiscordUser.avatarURL)
                    .setColor('BLUE')
            });

            // Circular reference due to accountOwner?
            await message.edit(embed);

            accountOwnerDiscordUser.send(`Your ${account._service} account has been **approved** by ${user}.`);
            message.channel.send(`Approved user ${accountOwnerDiscordUser}'s ${account._service} account: **${account._username}**.`);
        }
        else if (emoji.name === '🚫') {

            var accountOwner = message.guild.pointSystem.getUserByAccount(account);
            message.guild.pointSystem.removeUserAccount(user, account._service);
            await message.delete();

            accountOwnerDiscordUser.send(`Your ${account._service} account has been **rejected** by ${user}.`);
            message.channel.send(`Rejected user ${accountOwnerDiscordUser}'s ${account._service} account: **${account._username}**.`);
        }
    } else {
        user.send(`You don't have permissions to approve this account.`);
        messageReaction.remove(message.user);
    }
}