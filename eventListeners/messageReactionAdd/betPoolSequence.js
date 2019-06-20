const Discord = require('discord.js');
const emojis = require('../../core/points/Emojis.js');
const Bet = require('../../core/points/Bet.js');
const BetPool = require('../../core/points/BetPool.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

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

    // TO-DO: REMOVE THIS LATER
    bool = true;

    if (bool) {
        var betPool = message.guild.pointSystem.findBetPool(message.id);

        if (!betPool || betPool._status === BetPool.STATE.Refunded || betPool._status === BetPool.STATE.Awarded) {
            return;
        }

        messageReaction.remove(user);

        if (emoji.name === '✅') {
            switch (betPool.status) {
                case 'Pending':
                    betPool = message.guild.pointSystem.openBetPool(betPool, message.author);
                    user.send('Bet pool has opened.  Bets may now be placed.');

                    message.edit(RichEmbedBuilder.new(betPool));

                    for (var i in betPool._options) {
                        await message.react(`${emojis[parseInt(i) + 1]}`);
                    }
                    break;
                case 'Open':
                    if (betPool.currentPool === 0) {
                        user.send('No one has bet yet!');
                    }

                    betPool = message.guild.pointSystem.closeBetPool(betPool, message.author);
                    user.send('Bet pool has been closed.  No more bets are being accepted.');

                    message.edit(RichEmbedBuilder.new(betPool));

                    messageReaction.remove();

                    var reactions = message.reactions.entries();

                    for (let reaction of reactions) {

                        if (Object.values(emojis).indexOf(reaction[0]) === -1) {
                            continue;
                        }

                        reaction[1].users.forEach(u => {
                            if (u !== client.user) {
                                reaction[1].remove(u);
                            }
                        });
                    };
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

                client.users.get(owner).send(`Bet pool **${betPool._id}** has been cancelled. Refunding your bet of **${wager}**.`)
            });

            var reactions = message.reactions.entries();

            for (let reaction of reactions) {
                if (Object.values(emojis).indexOf(reaction[0]) === -1 &&
                    reaction[0] !== '🚫' && reaction[0] !== '✅') {
                    continue;
                }

                reaction[1].users.forEach(u => {
                    reaction[1].remove(u);
                });
            };
        }
    } else {
        user.send(`You don't have permissions to change this wager.`);
        messageReaction.remove(message.user);
    }
}