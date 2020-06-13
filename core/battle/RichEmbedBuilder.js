const Discord = require('discord.js');

module.exports.trapTriggered = function (trap, message, victimStats) {
    var victim = message.author;
    var owner = message.client.users.get(trap.userid);

    var embed = new Discord.RichEmbed()
        .setColor('RED');

    if (owner.id === victim.id) {
        embed.setAuthor(`${owner.username} Blew Themselves Up!`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png');
    }
    else {
        embed.setAuthor(`${owner.username}'s Trap Sprung!`, owner.avatarUrl);
    }

    if (victimStats.health === 0) {
        embed.setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
    }

    embed.setDescription(
        `**Phrase**: ${trap.phrase}\n` +
        `**Owner**: ${owner}\n` +
        `**Damage**: ${trap.getDamage()}\n\n` +
        `**Victim**: ${victim}\n` +
        `**Remaining Health**: ${victimStats.health}\n\n` +
        `*Traps deal more damage the longer they are alive for.*`);
    embed.setFooter(`Trap set at ${new Date(trap.createdAt).toString()}`, owner.avatarUrl);

    return embed;
}


module.exports.status = function (user, stats) {
    var embed = new Discord.RichEmbed()
        .setColor('DARK_RED')
        .setAuthor(user.username, user.displayAvatarURL);

    var descriptionString = `**XP**: ${stats.experience}
        **HP**: ${stats.health}
        **Traps Active**: ${(stats.trapActive !== undefined && stats.trapActive) ? 1 : 0}\n`;

    if ('description' in stats) {
        descriptionString += `**Description**: *${stats.description}*\n`
    }

    if (stats.inventory && stats.inventory.length > 0) {
        descriptionString += `**__Inventory__**:\n`;

        for (var index in stats.inventory) {
            const item = stats.inventory[index];

            if (item) {
                if ('effect' in item) {
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

    return embed;
}