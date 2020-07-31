const commando = require('discord.js-commando');
const Discord = require('discord.js');

const Trap = require('../../core/battle/Trap.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');

module.exports = class TopTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'toptraps',
            group: 'traps',
            memberName: 'toptraps',
            description: 'List the top traps ever fired in the server.',
            guildOnly: true,
            aliases: ['!top-traps'],
            examples: ['!toptraps']
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        var topTraps = battleSystem.topTraps;

        if (topTraps.length > 0) {
            var embed = new Discord.MessageEmbed()
                .setColor(`DARK_RED`)
                .setAuthor(`Top Traps`, topTraps[0]._config.trapIconSource);

            var string = ``;

            for (var i in topTraps) {
                var trap = topTraps[i];
                var owner = message.guild.members.cache.get(trap.owner);
                var victim = message.guild.members.cache.get(trap.victim)

                string += `[${parseInt(i) + 1}] (${trap.damage}) "${trap.phrase}" by ${owner} blew up ${victim}.\n`;
            }

            embed.setDescription(string);

            message.channel.send(embed);
        } else {
            message.channel.send(`No traps were found for this server.`);
        }
    }
}