const Discord = require('discord.js');

const BetPool = require('../../core/points/BetPool.js');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/points/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function (client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var index = Object.values(emojis).findIndex(e => e === emoji.name);

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

    var points = message.guild.pointSystem;

    var betPool = message.guild.pointSystem.findBetPool(message.id);

    if (betPool) {
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
            message.guild.pointSystem.adminRoles.find(r => message.guild.member(message.author).roles.has(r)).length > 0;

        if (betPool._status !== BetPool.STATE.Closed) {
            return;
        }

        if(!bool) {
            user.send(`Betting is closed. Only authorized roles can select a winner.`);
            return;
        }

        var winningIndex = Object.keys(emojis).find(key => emojis[key] === emoji.name) - 1;
        
        betPool = message.guild.pointSystem.completeBetPool(betPool, user, betPool._options[winningIndex]);

        message.edit(RichEmbedBuilder.new(betPool));

        message.channel.send(`*WINNER*: Bet pool **${betPool._id}** has paid out on **${betPool._winner}**. Winners will be notified.`);

        await new Promise(resolve => setTimeout(resolve, 5000));
        
        betPool = message.guild.pointSystem.awardBetPool(betPool);

        message.edit(RichEmbedBuilder.new(betPool));
        
        var winners = betPool.getAwardedBets();

        winners.forEach(bet => {
            var user = client.users.get(bet._user);

            user.send(`You've won **${bet._payout}** for betting on **${bet._outcome}** in bet pool **${betPool._id}**!`)
        });
    }
};

