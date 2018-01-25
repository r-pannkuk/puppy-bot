const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class StatusCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'status',
            group: 'pelt',
            memberName: 'status',
            description: 'Player stats for pelting.',
            examples: [ '!status', '!status @Dog' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a username to check their status.",
                    type: 'user',
                    default: {}
                }
            ]
        });
    }

    
    async run(message, { user }) {
        /* Checking if user was passed or if sent as default parameter. */

        if(Object.keys(user).length === 0) {
            user = message.author;
        }

        const stats = this.client.pointSystem.retrieve(user.id);

        var embed = new Discord.RichEmbed()
        .setColor('DARK_RED')
        .setAuthor(user.username, user.displayAvatarURL);

        if('description' in stats) {
            embed.setDescription(
                `**XP**: ${stats.xp}\n` + 
                `**HP**: ${stats.hp}\n` +
                `**Description**: *${stats.description}*\n\n` +
                `**__Inventory__**:`
            );
        }
        else {
            embed.setDescription(
                `**XP**: ${stats.xp}\n` + 
                `**HP**: ${stats.hp}\n\n` +
                `**__Inventory__**:`
            );
        }
        
        for(var index in stats.inventory) {
            const item = stats.inventory[index];

            if('effect' in item) {
                embed.addField(
                    item.name, 
                    `__ATK__: ${item.atk}\n` + 
                    `__Description__: *${item.description}*\n` + 
                    `__Bonus Effect__: *${item.effectDescription}*\n`
                );
            }
            else {
                embed.addField(
                    item.name,
                    `__ATK__: ${item.atk}\n` + 
                    `__Description__: *${item.description}*\n`
                );
            }
        }

        message.embed(embed);
    }
}