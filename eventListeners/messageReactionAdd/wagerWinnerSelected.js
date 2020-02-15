const Discord = require('discord.js');

const BetPool = require('../../core/points/BetPool.js');
const Bet = require('../../core/points/Bet.js');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/points/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var index = Object.values(emojis).findIndex(e => e === emoji.name);

    if(message.guild === undefined || message.guild === null) {
        return;
    }

    if (channel.type !== 'text') {
        return;
    }

    if (user === client.user) {
        return;
    }

    if (index === -1) {
        return;
    }

    // Get the message ID and look it up in the list of bet messages
    // Assign this user a new bet from the wager.

    var betPool = message.guild.pointSystem.findBetPoolByMessage(message.id);

    if (betPool) {
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
            message.guild.pointSystem.adminRoles.find(r => message.guild.member(user).roles.has(r));

        if (betPool._status !== BetPool.STATE.Closed) {
            return;
        }

        if (!bool) {
            user.send(`Betting is closed. Only authorized roles can select a winner.`);
            return;
        }

        var winningIndex = Object.keys(emojis).find(key => emojis[key] === emoji.name) - 1;

        betPool = message.guild.pointSystem.completeBetPool(betPool, user, betPool._options[winningIndex]);

        await message.clearReactions()
        message.edit(RichEmbedBuilder.new(betPool));

        message.channel.send(`*WINNER*: Bet pool **${betPool.name}** has paid out on **${betPool._winner}**. Winners will be notified.`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        betPool = message.guild.pointSystem.awardBetPool(betPool);

        message.edit(RichEmbedBuilder.new(betPool));

        var bets = Object.values(betPool._bets);
        var betOutcomes = {};
        betOutcomes[Bet.STATUS.Lost] = [];
        betOutcomes[Bet.STATUS.Awarded] = [];

        bets.forEach(bet => {
            var user = client.users.get(bet._user);

            if (bet._status === Bet.STATUS.Awarded) {
                user.send(`You've won **${bet._payout}** for betting on **${bet._outcome}** in bet pool **${betPool._name}**!`);
            }

            betOutcomes[bet._status].push({
                user: user.username,
                outcome: bet._outcome,
                wager: bet._wager,
                payout: bet._payout
            });
        });

        RichEmbedBuilder.results(betPool, betOutcomes).forEach(s => message.channel.send(s));

    }
};

