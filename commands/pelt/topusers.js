const commando = require('discord.js-commando');
const Discord = require('discord.js');

const User = require('../../core/battle/User.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');
const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js');

module.exports = class TopUsersCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'topusers',
            group: 'pelt',
            memberName: 'topusers',
            description: 'List the top users in the server by their battle experience.',
            aliases: ['!top-users'],
            examples: ['!topusers']
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        var topUsers = battleSystem.topUsers;

        if (topUsers.length > 0) {
            var embed = new Discord.RichEmbed()
                .setColor(`GOLD`)
                .setAuthor(`Top Users`);

            var string = ``;

            for (var i in topUsers) {
                var user = topUsers[i];
                var member = message.guild.members.get(user.id);

                string += `[${parseInt(i) + 1}] (${user.experience}) ${member} - Level ${user.level}\n`;
            }

            embed.setDescription(string);

            message.channel.send(embed);
        } else {
            message.channel.send(`No users were found for this server.`);
        }
    }
}