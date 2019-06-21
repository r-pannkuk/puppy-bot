const BetPool = require('../../core/points/BetPool.js');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/points/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = function(client, messageReaction, user) {
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

    if(index === -1) {
        return;
    }

    // Get the message ID and look it up in the list of bet messages
    // Assign this user a new bet from the wager.

    var points = message.guild.pointSystem;

    var betPool = message.guild.pointSystem.findBetPool(message.id);

    if(betPool) {
        if(betPool._status !== BetPool.STATE.Open) {
            messageReaction.remove(user);
            return;
        }

        var bet = betPool.getActiveBet(user.id);
        betPool = points.refundBet(user, betPool);

        if(!betPool) {
            return;
        }
        
        bet = betPool._bets[bet._id];

        var userPoints = message.guild.pointSystem.getUser(user);
        
        message.edit(RichEmbedBuilder.new(betPool));
        
        user.send(RichEmbedBuilder.userBet(bet, betPool, message, userPoints));
    }
};

