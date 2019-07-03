const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/points/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

const OPTIONS_LIMIT = 16;


module.exports = class GetWagersCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'getwagers',
            group: 'points',
            memberName: 'getwagers',
            aliases: ['get-wagers', 'wagerlist', 'gw'],
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
                        return val.toLowerCase();
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

        for (var i in betPools) {
            var bp = betPools[i];

            var betPool = pointSystem._serializeBetPool(bp._id);

            var channels = message.guild.channels.array();

            for (var i in channels) {
                var foundChannel = channels[i];

                if (foundChannel.type !== 'text') {
                    continue;
                }

                if(!betPool._message._id) {
                    continue;
                }

                console.log(`Bet Pool Message ID: ${betPool._message._id}`);

                var foundMessage = await foundChannel.fetchMessage(betPool._message._id);

                if (foundMessage) {
                    break;
                }
            }

            if (!foundMessage) {
                await message.channel.send(`Could not find existing wager ${betPool.name}.`);
                return;
            }

            var foundChannel = foundMessage.channel;
            var link = RichEmbedBuilder.discordLink(foundGuild, foundChannel, foundMessage);
            await message.channel.send(`**${betPool.name}**: ${link}`);
        }
    }
}