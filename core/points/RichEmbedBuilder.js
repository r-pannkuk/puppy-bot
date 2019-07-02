const Discord = require('discord.js');
const BetPool = require('./BetPool.js');
const emojis = require('./Emojis.js');
const Bet = require('./Bet.js');
const Account = require('./Account.js');

const LIMIT = 2000;

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
            return prev += `\t**${outcome.user}** - Wagered **${outcome.wager}** on [**${outcome.outcome}**] and won [**${outcome.payout}**]\n`;
        }, ``)
    }

    var msg = `__**Results**__: ${betPool.message().author}\n`;

    for (let [key, value] of Object.entries(fields)) {
        if (value) {
            var status = parseInt(key);
            if (status === Bet.STATUS.Won || status === Bet.STATUS.Awarded) {
                msg += `  __Winners__:\n${value}`;
            } else if (status === Bet.STATUS.Lost) {
                msg += `  __Losers__:\n${value}`;
            }
        }
    }

    return msg.split(LIMIT);
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
    if (channel) {
        link += `/${channel.id}`;
    }
    if (message) {
        link += `/${message.id}`;
    }

    return link;
}

module.exports.discordLink = discordLink;

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

module.exports.addReactions = async function ({
    message, 
    betPool,
    reactCheckmark = true,
    reactCancel = true,
    reactOptions = true
}) {
    if (reactCheckmark) {
        await message.react('✅');
    }

    if (reactCancel) {
        await message.react('🚫');
    }

    if (reactOptions) {
        for (var i in betPool._options) {
            await message.react(`${emojis[parseInt(i) + 1]}`);
        }
    }
}

function addAccountField(richEmbed, account) {
    var fieldDesc = ``;

    if (account._username) {
        fieldDesc += `__Username__: **${account._username}**\n`;
    }
    if (account._email) {
        fieldDesc += `__Email:__: **${account._email}**\n`;
    }
    if (account._status) {
        var status = ``;
        switch (account._status) {
            case Account.STATUS.Pending:
                status = `Pending`
                break;
            case Account.STATUS.Approved:
                status = `Approved`;
                break;
            case Account.STATUS.Confirmed:
                status = `Confirmed`;
                break;
        }
        fieldDesc += `__Status:__: **${status}**\n`;
    }
    switch (account._service) {
        case Account.SERVICE.Challonge:
            richEmbed.addField('Challonge', fieldDesc)
            break;
    }

    return richEmbed;
}

module.exports.userAccount = function ({
    user,
    serviceType,
    embed = new Discord.RichEmbed()
}) {
    var account = user._accounts.find(a => a._service === serviceType);
    embed = addAccountField(embed, account);

    return embed;
}

module.exports.userAccounts = function ({
    user,
    embed = new Discord.RichEmbed()
}) {
    for (var i in user._accounts) {
        embed = addAccountField(embed, user._accounts[i]);
    }

    return embed;
}