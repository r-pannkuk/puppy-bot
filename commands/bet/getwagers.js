const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/bet/Emojis.js');
const MessageEmbedBuilder = require('../../core/points/EmbedBuilder.js');

const OPTIONS_LIMIT = 16;


module.exports = class GetWagersCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'getwagers',
            group: 'bet',
            memberName: 'getwagers',
            aliases: ['checkwagers', 'get-wagers', 'wagerlist', 'gw'],
            description: 'Creates a new wager pool for players to bet on.',
            examples: ['!newwager 500 @Dog#3471 @Hazelyn#6286'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'searchParameter',
                    prompt: "Enter a search searchParametereter to look for.",
                    type: 'string',
                    parse: (val, msg, arg) => {
                        if (val) {
                            return val.toLowerCase();
                        } else {
                            return val;
                        }
                    },
                    default: ''
                }
            ]
        });
    }

    async run(message, { searchParameter }) {
        var pointSystem = message.guild.pointSystem;

        if (searchParameter === '') {
            searchParameter = 'open';
        }

        var betPools = pointSystem.findAllBetPools(bp => {
            return bp._name.toLowerCase().indexOf(searchParameter) !== -1 ||
                bp._id.toLowerCase().indexOf(searchParameter) !== -1 ||
                bp._options.some(o => o.toLowerCase().indexOf(searchParameter) !== -1) ||
                (bp._winner || '').toLowerCase().indexOf(searchParameter) !== -1 ||
                bp.status.toLowerCase().indexOf(searchParameter) !== -1
        });

        if (betPools.length === 0) {
            message.channel.send(`No bet pools found.`);
            return;
        }

        var pointSystem = message.guild.pointSystem;
        var foundGuild = message.guild;
        var messageString = ``;

        for (var i in betPools) {
            var bp = betPools[i];

            var betPool = pointSystem._serializeBetPool(bp._id);

            if (!betPool._message._id) {
                continue;
            }

            var channels = message.guild.channels.cache.array();

            for (var i in channels) {
                var foundMessage = false;
                var foundChannel = channels[i];

                if (foundChannel.type !== 'text') {
                    continue;
                }

                try {
                    foundMessage = await foundChannel.messages.fetch(betPool._message._id);
                } catch (error) {
                    continue;
                }

                if (foundMessage) {
                    break;
                }
            }

            if (foundMessage) {
                var foundChannel = foundMessage.channel;
                var link = MessageEmbedBuilder.discordLink(foundGuild, foundChannel, foundMessage);
                messageString += `**${betPool.name}**: ${link}\n`;
            } else {
                message.channel.send(`Bet pool message for **${betPool.name}** was not found. Recreating:`);
                foundMessage = await message.channel.send(MessageEmbedBuilder.new(betPool));
                message.guild.pointSystem.subscribeBetPool(betPool, foundMessage);

                await MessageEmbedBuilder.addReactions({
                    message: foundMessage,
                    betPool: betPool
                });
            }
        }

        if (messageString !== '') {
            var pieces = messageString.split(2000);
            pieces.forEach(s => message.channel.send(s));
        }
    }
}