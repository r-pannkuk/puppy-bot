const Discord = require('discord.js');
const User = require('./User.js');
const UserInventoryItem = require('./UserInventoryItem.js');
const TimeExtract = require('../TimeExtract.js');

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


/**
 * 
 * @param {Discord.GuildMember} guildMember 
 * @param {User} userObj 
 */
module.exports.status = function (guildMember, userObj) {
    var embed = new Discord.RichEmbed()
        .setColor('DARK_RED')
        .setAuthor(guildMember.displayName, guildMember.user.displayAvatarURL);

    var descriptionString = `**Level**: ${userObj.level}
        **XP**: ${userObj.experience} ${(userObj.stats.nextLevelExperience) ? ` / ${userObj.stats.nextLevelExperience}` : ``}
        **HP**: ${userObj.health} / ${userObj.stats.maxHealth}
        **Energy**: ${userObj.energy} / ${userObj.stats.maxEnergy}
        **Traps Active**: ${userObj.traps.length} / ${userObj.stats.maxTraps}\n`;

    if (userObj.description !== null) {
        descriptionString += `\n**Description**: *${userObj.description}*\n`
    }

    embed.setDescription(descriptionString);

    if (userObj.inventory && userObj.inventory.items.length > 0) {
        var inventoryString = userObj.inventory.items
            .sort((a, b) => {
                if (a.cooldown === b.cooldown) {
                    return b.item.level - a.item.level;
                }
                return a.cooldown - b.cooldown;
            }).reduce((prev, i) => {
                var item = i.item;
                var cooldown = i.cooldown;
                var duration = TimeExtract.interval_string_milliseconds(cooldown);

                var prefix = ``;
                var suffix = ``;

                if (cooldown > 0) {
                    suffix = ` -- ${duration}`
                } else {
                    prefix = `***`;
                    suffix = `***`;
                }
                return prev + `${prefix}${item.name}${suffix}\n`;
            }, "");

        embed.addField('Inventory', inventoryString);
    }


    return embed;
}

/**
 * 
 * @param {object} args 
 * @param {User|Discord.GuildMember} args.attacker Who commited the action.
 * @param {User|Discord.GuildMember} args.victim Who was the intended target.
 * @param {UserInventoryItem} args.item What was the item used to commit.
 */
module.exports.useItem = function ({ attacker, victim, item }) {
    var embed = new Discord.RichEmbed()
        .setColor('DARK_RED')
        .setAuthor(`${attacker.nickname} Attacked with an Item!`, attacker.user.displayAvatarURL)

    embed.setDescription(`**Target**: ${victim.user}
    **Damage**: ${item.item.attack}
    **Health**: ${Math.floor(victim._stats._health)} / ${victim._stats.maxHealth}`);

    embed.addField(`${item.item.name}`,
        `${item.item.description}`);

    embed.addField(`**Level**`, `${item.item.level}`, false);
    embed.addField(`**Attack**`, `${item.item.attack}`, true);
    embed.addField(`**Energy**`, `${item.item.energy}`, true);
    embed.addField(`**Cooldown**`, `${TimeExtract.interval_string_milliseconds(item.item.cooldown)}`, true);

    embed.setImage(`${item.item.image}`);
    embed.image.height = 100;
    embed.image.width = 100;

    return embed;
}

/**
 * 
 * @param {object} args 
 * @param {boolean} args.isNew Is this a new item for the user.
 * @param {User|Discord.GuildMember} args.attacker Who commited the action.
 * @param {User|Discord.GuildMember} args.victim Who was the intended target.
 * @param {UserInventoryItem} args.item What was the item used to commit.
 */
module.exports.pelt = function ({ isNew, attacker, victim, item }) {
    var embed = this.useItem({ attacker, victim, item });

    embed.setAuthor(`${attacker.nickname} Pelted!`, attacker.user.displayAvatarURL);

    if (isNew) {
        embed.setFooter(`*New Item! ${item.item.name} was added to ${attacker.nickname}'s inventory.*`, 'http://puppy-bot.com/puppy-bot-discord/media/battle/items/treasure-chest.png');
    }

    return embed;
}