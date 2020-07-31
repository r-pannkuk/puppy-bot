const Discord = require('discord.js');

const BetPool = require('../../core/bet/BetPool.js');
const Bet = require('../../core/bet/Bet.js');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/bet/Emojis.js');
const MessageEmbedBuilder = require('../../core/points/EmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var index = Object.values(emojis).findIndex(e => e === emoji.name);

    if (message.guild === undefined || message.guild === null) {
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
        if (!message.guild.pointSystem.getUserAuthorization(message.guild.members.cache.get(user.id))) {
            user.send(`Betting is closed. Only authorized roles can select a winner.`);
            return;
        }

        if (betPool._status !== BetPool.STATE.Closed) {
            return;
        }

        var winningIndex = Object.keys(emojis).find(key => emojis[key] === emoji.name) - 1;

        betPool = message.guild.pointSystem.completeBetPool(betPool, user, betPool._options[winningIndex]);

        await message.reactions.removeAll()
        message.edit(MessageEmbedBuilder.new(betPool));

        message.channel.send(`*WINNER*: Bet pool **${betPool.name}** has paid out on **${betPool._winner}**. Winners will be notified.`);

        await new Promise(resolve => setTimeout(resolve, 5000));

        betPool = message.guild.pointSystem.awardBetPool(betPool);

        message.edit(MessageEmbedBuilder.new(betPool));

        var bets = Object.values(betPool._bets).filter(b => b && (b._status === Bet.STATUS.Lost || b._status === Bet.STATUS.Awarded));
        var betOutcomes = {};
        betOutcomes[Bet.STATUS.Lost] = [];
        betOutcomes[Bet.STATUS.Awarded] = [];

        bets.forEach(bet => {
            var user = client.users.cache.get(bet._user);

            if (bet._status === Bet.STATUS.Awarded) {
                user.send(`You've won **${bet._payout}** for betting on **${bet._outcome}** in bet pool **${betPool._name}**!`);
            }

            betOutcomes[bet._status].push({
                user: message.guild.member(user).displayName,
                outcome: bet._outcome,
                wager: bet._wager,
                payout: bet._payout
            });
        });

        MessageEmbedBuilder.results(betPool, betOutcomes).forEach(s => message.channel.send(s));

    }
};