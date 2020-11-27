const commando = require('discord.js-commando');
const Discord = require('discord.js');

const Trap = require('../../core/battle/Trap.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');

module.exports = class TopBlunderCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'topblunders',
            group: 'traps',
            memberName: 'topblunders',
            description: 'List the top blunders / self-explosions ever fired in the server.',
            guildOnly: true,
            aliases: ['top-blunders', 'topdumb', 'top-dumb', 'topidiots', 'top-idiots'],
            examples: ['!topblunders']
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        var topBlunders = battleSystem.topBlunders;

        if (topBlunders.length > 0) {
            var embed = new Discord.MessageEmbed()
                .setColor(`DARK_RED`)
                .setAuthor(`Top Blunders`, topBlunders[0]._config.trapIconSource);

            var string = ``;

            for (var i in topBlunders) {
                var trap = topBlunders[i];
                var owner = message.guild.members.cache.get(trap.owner);

                string += `[${parseInt(i) + 1}] (${trap.damage}) "${trap.phrase}" by ${owner}.\n`;
            }

            embed.setDescription(string);

            message.channel.send(embed);
        } else {
            message.channel.send(`No blunders were found for this server.`);
        }
    }
}