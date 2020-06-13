const Discord = require('discord.js');
const emojis = require('../../core/bet/Emojis.js');
const Bet = require('../../core/bet/Bet.js');
const BetPool = require('../../core/bet/BetPool.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    if(message.guild === undefined || message.guild === null) {
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

        var betPool = message.guild.pointSystem.findBetPoolByMessage(message.id);

        if (!betPool || betPool._status === BetPool.STATE.Refunded || betPool._status === BetPool.STATE.Awarded) {
            return;
        }

        messageReaction.remove(user);

        if (emoji.name === '✅') {
            switch (betPool._status) {
                case BetPool.STATE.Pending:
                    betPool = message.guild.pointSystem.openBetPool(betPool, message.author);
                    user.send('Bet pool has opened.  Bets may now be placed.');

                    message.edit(RichEmbedBuilder.new(betPool));

                    for (var i in betPool._options) {
                        await message.react(`${emojis[parseInt(i) + 1]}`);
                    }
                    break;
                case BetPool.STATE.Open:
                    if (betPool.currentPool === 0) {
                        user.send('No one has bet yet!');
                        return;
                    }

                    betPool = message.guild.pointSystem.closeBetPool(betPool, message.author);
                    user.send('Bet pool has been closed.  No more bets are being accepted.');

                    message.edit(RichEmbedBuilder.new(betPool));

                    await message.clearReactions();

                    await RichEmbedBuilder.addReactions({
                        message: message, 
                        betPool: betPool
                    });

                    break;
                default:
                    break;
            }

        }
        else if (emoji.name === '🚫') {
            var pendingRefunds = Object.values(betPool._bets)
                .filter(b => b._status !== Bet.STATUS.Refunded);

            betPool = message.guild.pointSystem.refundBetPool(betPool);
            user.send('Bet pool refunded.  All users will have their money returned to them.');

            message.edit(RichEmbedBuilder.new(betPool));

            pendingRefunds.forEach(bet => {
                var wager = bet._wager;
                var owner = bet._user;

                client.users.get(owner).send(`Bet pool **${betPool.name}** has been cancelled. Refunding your bet of **${wager}**.`)
            });

            await message.clearReactions();
        }
    } else {
        user.send(`You don't have permissions to change this wager.`);
        messageReaction.remove(message.user);
    }
}