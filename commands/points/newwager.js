const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');


module.exports = class PenaltyCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'newwager',
            group: 'points',
            memberName: 'newwager',
            alias: 'new-wager',
            description: 'Creates a new wager pool for players to bet on.',
            examples: ['!newwager 500 @Dog#3471 @Hazelyn#6286'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'wager',
                    prompt: "Enter an optional reason for why this user is being penalized.",
                    type: 'integer',
                    min: 1
                },
                {
                    key: 'options',
                    prompt: "Enter the possible values to bet on for this wager.",
                    type: 'string',
                    infinite: true
                }

            ]
        });
    }

    async run(message, { wager, options }) {
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR;
        if (!bool) {
            message.channel.send('You must have permissions to use this command.');
        }

        var source = new Source({
            _type: Source.TYPE.Command,
            _id: message._id
        });

        var betPool = message.guild.pointSystem.newBetPool(message.author, wager, source, options);

        var embed = new Discord.RichEmbed()
            .setColor('RED')
            .setAuthor(`New Wager`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png')
            .setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
            var description = `**Status**: ${betPool.status}\n` +
                `**Bet**: ${betPool.betSize}\n\n`;

        var emojis = {
            1: "\u0031\u20E3",
            2: "\u0032\u20E3",
            3: "\u0033\u20E3",
            4: "\u0034\u20E3",
            5: "\u0035\u20E3",
            6: "\u0036\u20E3",
            7: "\u0037\u20E3",
            8: "\u0038\u20E3",
            9: "\u0039\u20E3",
            10: "\ud83d\udd1f",
            11: "\uD83C\uDDE6",
            12: "\uD83C\uDDE7",
            13: "\uD83C\uDDE8",
            14: "\uD83C\uDDE9",
            15: "\uD83C\uDDEA",
            16: "\uD83C\uDDEB"
        }

        var discordifyOption = (val) => {
            const matches = val.match(/^<@!?(\d+)>$/);
            if (matches === null) return val;

            const id = matches[1];
            return message.guild.members.get(id).displayName;
        }

        for (var i in options) {
            description += `${emojis[parseInt(i) + 1]}: **${discordifyOption(options[i])}**\n`;
        }

        description += '\n';
        description += `**React with your choice to enter the bet pool.**`;

        embed.setDescription(description)
            .setFooter(`Bet pool last updated at ${new Date(betPool._lastEdited).toString()} by ${message.guild.members.get(betPool.lastUser.id).displayName}.`);

        message.channel.send(embed).then(async (msg) => {

            message.guild.pointSystem.subscribeBetPool(betPool, msg);

            for (var i in options) {
                await msg.react(`${emojis[parseInt(i) + 1]}`);
            }
        });
    }
}