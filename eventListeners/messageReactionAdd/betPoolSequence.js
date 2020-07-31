const Discord = require('discord.js');
const emojis = require('../../core/bet/Emojis.js');
const Bet = require('../../core/bet/Bet.js');
const BetPool = require('../../core/bet/BetPool.js');
const MessageEmbedBuilder = require('../../core/points/EmbedBuilder.js');

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

    var betPool = message.guild.pointSystem.findBetPoolByMessage(message.id);

    if (!betPool || betPool._status === BetPool.STATE.Refunded || betPool._status === BetPool.STATE.Awarded) {
        return;
    }

    if (!message.guild.pointSystem.getUserAuthorization(message.guild.members.cache.get(user.id))) {
        user.send(`You don't have permissions to change this wager.`);
        return;
    }

    messageReaction.remove(user);

    if (emoji.name === '✅') {
        switch (betPool._status) {
            case BetPool.STATE.Pending:
                betPool = message.guild.pointSystem.openBetPool(betPool, message.author);
                user.send('Bet pool has opened.  Bets may now be placed.');

                message.edit(MessageEmbedBuilder.new(betPool));

                for (var i in betPool._options) {
                    await message.react(`${emojis[parseInt(i) + 1]}`);
                }
                break;
            case BetPool.STATE.Open:
                if (betPool.currentPool === 0) {
                    user.send('The pool is empty!');
                    return;
                }

                betPool = message.guild.pointSystem.closeBetPool(betPool, message.author);
                user.send('Bet pool has been closed.  No more bets are being accepted.');

                message.edit(MessageEmbedBuilder.new(betPool));

                await message.reactions.removeAll();

                await MessageEmbedBuilder.addReactions({
                    message: message,
                    betPool: betPool
                });

                break;
            default:
                break;
        }

    } else if (emoji.name === '🚫') {
        var pendingRefunds = Object.values(betPool._bets)
            .filter(b => b._status !== Bet.STATUS.Refunded);

        betPool = message.guild.pointSystem.refundBetPool(betPool);
        user.send('Bet pool refunded.  All users will have their money returned to them.');

        message.edit(MessageEmbedBuilder.new(betPool));

        pendingRefunds.forEach(bet => {
            var wager = bet._wager;
            var owner = bet._user;

            client.users.cache.get(owner).send(`Bet pool **${betPool.name}** has been cancelled. Refunding your bet of **${wager}**.`)
        });

        await message.reactions.removeAll();
    }
}