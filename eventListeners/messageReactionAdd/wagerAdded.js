const BetPool = require('../../core/bet/BetPool.js');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/bet/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = async function(client, messageReaction, user) {
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

    if(index === -1) {
        return;
    }

    // Get the message ID and look it up in the list of bet messages
    // Assign this user a new bet from the wager.

    var points = message.guild.pointSystem;

    var betPool = message.guild.pointSystem.findBetPoolByMessage(message.id);

    if(betPool) {
        if(betPool._status !== BetPool.STATE.Open) {
            // TO-DO: FIgure out a way to deal with message adds and other phases.
            // messageReaction.remove(user);
            // user.send(`Betting pool is not open.  Please try again later.`);
            return;
        }

        var existingBet = betPool.getActiveBet(user.id);
        if(existingBet) {
            user.send(`You\'ve already bet on **${betPool.name}** under **${existingBet._outcome}**.`);
            return;
        }

        var source = new Source({
            _id: message.id,
            _type: Source.TYPE.Reaction
        });

        var bet = points.newBet(user, betPool, source, betPool._options[index]);
        betPool = points.betPools[betPool._id];

        var userPoints = message.guild.pointSystem.getUser(user);

        message.edit(RichEmbedBuilder.new(betPool));

        user.send(RichEmbedBuilder.userBet(bet, betPool, message, userPoints));
    }
};

