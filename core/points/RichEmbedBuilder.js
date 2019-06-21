const Discord = require('discord.js');
const BetPool = require('./BetPool.js');
const emojis = require('./Emojis.js');
const Bet = require('./Bet.js');

module.exports.new = function (betPool) {
    return new Discord.RichEmbed()
        .setColor(betPool.message().color)
        .setAuthor(betPool.message().author, betPool.message().authorIcon)
        .setThumbnail(betPool.message().thumbnail)
        .setDescription(betPool.message().description)
        .setFooter(betPool.message().footer);
}

module.exports.results = function (betPool, betOutcomes) {
    var fields = {};

    for (let [key, value] of Object.entries(betOutcomes)) {
        value = value.sort((o1, o2) => o2.payout - o1.payout);
        fields[key] = value.reduce((prev, outcome) => {
            return prev += `**${outcome.user}** - Wagered **${outcome.wager}** on [**${outcome.outcome}**] and won [**${outcome.payout}**]\n`;
        }, ``)
    }

    var embed = new Discord.RichEmbed()
        .setColor(betPool.message().color)
        .setAuthor(`Results: ${betPool.message().author}`);

    for (let [key, value] of Object.entries(fields)) {
        if (value) {
            var status = parseInt(key);
            if (status === Bet.STATUS.Won || status === Bet.STATUS.Awarded) {
                embed.addField('Winners:', value);
            } else if (status === Bet.STATUS.Lost) {
                embed.addField('Losers:', value);
            }
        }
    }

    return embed;
}

function betString(bet) {
    if (bet._status === Bet.STATUS.Awarded) {
        return `Awarded`;
    } else if (bet._status === Bet.STATUS.Won) {
        return `Won`;
    } else if (bet._status === Bet.STATUS.Lost) {
        return `Lost`;
    } else if (bet._status === Bet.STATUS.Pending) {
        return `Pending`;
    } else if (bet._status === Bet.STATUS.Refunded) {
        return `Refunded`;
    }
}

function discordLink(guild, channel, message) {
    var link = `https://discordapp.com/channels/${guild.id}`;
    if(channel) {
        link += `/${channel.id}`;
    }
    if(message) {
        link += `/${message.id}`;
    }

    return link;
}

module.exports.userBet = function (bet, betPool, msg, user) {
    var index = Object.values(betPool._options).findIndex(o => o === bet._outcome) + 1;
    var embed = new Discord.RichEmbed()
        .setColor(betPool.message().color)
        .setAuthor(`Bet Update`)
        .setDescription(
            `**Bet Pool**: [${betPool.name}](${discordLink(msg.guild, msg.channel, msg)})\n` +
            `**Status**: ${betString(bet)}\n` +
            `**Outcome**: ${bet._outcome}\n` +
            `**Emoji**: ${emojis[index]}\n` +
            `**Bet**: ${bet._wager}\n`
        )
        .setFooter(`Current Balance: ${user._currentBalance}`)
        .setURL(discordLink(msg.guild, msg.channel, msg));

    return embed;
}