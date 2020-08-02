const Discord = require('discord.js');

const User = require('./User.js');
const UserInventoryItem = require('./UserInventoryItem.js');
const TimeExtract = require('../TimeExtract.js');
const Trap = require('./Trap.js');
const UserStatistics = require('./UserStatistics.js');
const Item = require('./Item.js');

/**
 * 
 * @param {Trap} trap 
 * @param {Discord.Message} message 
 */
module.exports.checkTrap = function (trap, message) {
    /** @type {BattleSystem} */
    var owner = message.guild.members.cache.get(trap.owner);

    var embed = new Discord.MessageEmbed()
        .setColor('RED');

    embed.setAuthor(`${owner.displayName}'s Trap: ${trap.phrase}`, trap._config.trapIconSource);

    var duration = TimeExtract.interval_string_milliseconds((trap.firedAt || Date.now()) - trap.createdAt);
    var createdAt = new Date(trap.createdAt);

    embed.setDescription(
        `**Phrase**: ${trap.phrase}\n` +
        `**Owner**: ${owner}\n` +
        `**Damage**: ${trap.damage}\n` +
        `**Duration**: ${duration}\n\n` +
        `*Traps deal more damage the longer they are alive for.*`);
    embed.setFooter(`Trap set at ${createdAt.toDateString()} ${createdAt.toLocaleTimeString()}`, owner.user.displayAvatarURL());

    return embed;
}

/**
 * 
 * @param {Trap} trap 
 * @param {Discord.Message} message 
 * @param {User} victimStats 
 */
module.exports.trapTriggered = function (trap, message, victimStats) {
    var victim = message.author;
    var owner = message.guild.members.cache.get(trap.owner);

    var embed = new Discord.MessageEmbed()
        .setColor('RED');

    if (owner.id === victim.id) {
        embed.setAuthor(`${owner.displayName} Blew Themselves Up!`);
        embed.setThumbnail(trap._config.trapSelfIconSource);
    }
    else {
        embed.setAuthor(`${owner.displayName}'s Trap Sprung!`);
        embed.setThumbnail(trap._config.trapIconSource);
    }

    if (victimStats.health === 0) {
        embed.setThumbnail(trap._config.trapIconSource);
    }

    var duration = TimeExtract.interval_string_milliseconds(trap.firedAt - trap.createdAt);
    var createdAt = new Date(trap.createdAt);

    embed.setDescription(
        `**Phrase**: [${trap.phrase}](${message.url})\n` +
        `**Owner**: ${owner}\n` +
        `**Damage**: ${trap.damage}\n` +
        `**Duration**: ${duration}\n\n` +
        `**Victim**: ${victim}\n` +
        `**Remaining Health**: ${victimStats.health}\n\n` +
        `*Traps deal more damage the longer they are alive for.*`);
    embed.setFooter(`Trap set at ${createdAt.toDateString()} ${createdAt.toLocaleTimeString()}`, owner.user.displayAvatarURL());

    return embed;
}


/**
 * 
 * @param {Discord.GuildMember} guildMember 
 * @param {User} userObj 
 */
module.exports.status = function (guildMember, userObj) {
    var embed = new Discord.MessageEmbed()
        .setColor('DARK_RED')
        .setAuthor(guildMember.displayName, guildMember.user.displayAvatarURL());

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
            .reduce((prev, i) => {
                var item = i.schema;
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
 * @param {Discord.GuildMember} guildMember 
 * @param {User} stats 
 * @param {import('./Item.js').ItemConfig[]} itemConfig
 */
module.exports.itemList = function (guildMember, stats, itemConfig) {
    var embed = new Discord.MessageEmbed()
        .setColor('PURPLE')
        .setAuthor(`${guildMember.displayName}'s Item Checklist`, guildMember.user.displayAvatarURL());

    var itemList = itemConfig.filter(ic => ic.level <= stats.level).map(ic => {
        var foundItem = stats.inventory.items.find(i => ic.id === i.id);
        return `${(!foundItem) ? `` : `~~`}[${ic.level}] ${ic.name}${(!foundItem) ? `` : `~~`}`;
    })

    embed.setDescription(itemList.join('\n'));

    return embed;
};

/**
 * 
 * @param {User} user 
 * @param {UserStatistics} beforeStats 
 */
module.exports.levelUp = function (user, beforeStats) {
    var embed = new Discord.MessageEmbed()
        .setColor('GOLD')
        .setAuthor('You leveled up!');

    var afterStats = user.stats;

    embed.addField(beforeStats.level,
        `**HP**: ${beforeStats.maxHealth}\n` +
        `**Energy**: ${beforeStats.maxEnergy}\n` +
        `**Max Traps**: ${beforeStats.maxTraps}\n` +
        `**XP Left**: 0`,
        true);

    embed.addField(`\u200b`, "➡️\n\n➡️", true);

    embed.addField(afterStats.level,
        `**HP**: ${afterStats.maxHealth}\n` +
        `**Energy**: ${afterStats.maxEnergy}\n` +
        `**Max Traps**: ${afterStats.maxTraps}\n` +
        `**XP Left**: ${afterStats.experience} / ${afterStats.nextLevelExperience}`,
        true);

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
    var embed = new Discord.MessageEmbed()
        .setColor('DARK_RED')
        .setAuthor(`${attacker.displayName} Attacked with an Item!`, attacker.user.displayAvatarURL())

    embed.setDescription(`**Target**: ${victim.user}
    **Damage**: ${item.schema.attack}
    **Health**: ${Math.floor(victim._stats._health)} / ${victim._stats.maxHealth}`);

    embed.addField(`${item.schema.name}`,
        `${item.schema.description}`);

    embed.addField(`**Level**`, `${item.schema.level}`, false);
    embed.addField(`**Attack**`, `${item.schema.attack}`, true);
    embed.addField(`**Energy**`, `${item.schema.energy}`, true);
    embed.addField(`**Cooldown**`, `${TimeExtract.interval_string_milliseconds(item.schema.cooldown)}`, true);

    embed.setThumbnail(`${item.schema.image}`);

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

    embed.setAuthor(`${attacker.displayName} Pelted!`, attacker.user.displayAvatarURL());

    if (isNew) {
        embed.setFooter(`*New Item! ${item.schema.name} was added to ${attacker.displayName}'s inventory.*`, 'http://puppy-bot.com/puppy-bot-discord/media/battle/items/treasure-chest.png');
    }

    return embed;
}