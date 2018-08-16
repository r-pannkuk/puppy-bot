const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class StatusCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'status',
            group: 'pelt',
            memberName: 'status',
            description: 'Player stats for battle.',
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

        const stats = message.guild.battleSystem.retrieve(user.id);

        var embed = new Discord.RichEmbed()
        .setColor('DARK_RED')
        .setAuthor(user.username, user.displayAvatarURL);

        var descriptionString = `**XP**: ${stats.xp}
        **HP**: ${stats.hp}
        **Traps Active**: ${(stats.trapActive !== undefined && stats.trapActive) ? 1 : 0}\n`;

        if('description' in stats) {
            descriptionString +=  `**Description**: *${stats.description}*\n`
        }

        if(stats.inventory && stats.inventory.length > 0) {
            descriptionString += `**__Inventory__**:\n`;

            for(var index in stats.inventory) {
                const item = stats.inventory[index];
    
                if(item) {
                    if('effect' in item) {
                        embed.addField(
                            item.name, 
                            `__ATK__: ${item.atk}
                            __Description__: *${item.description}*
                            __Bonus Effect__: *${item.effectDescription}*\n`
                        );
                    }
                    else {
                        embed.addField(
                            item.name,
                            `__ATK__: ${item.atk}
                            __Description__: *${item.description}*\n`
                        );
                    }
                }
            }
        }

        embed.setDescription(descriptionString);

        message.embed(embed);
    }
};