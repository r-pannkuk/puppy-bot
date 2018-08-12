const Discord = require('discord.js');

const config = require("../commands/pelt/config.json");

module.exports = class BattleSystem {
    constructor(guildSettings) {
        if (guildSettings.get('battle') === undefined) {
            console.log("Battle settings not found, creating.");
            guildSettings.set('battle', {});
        }
        
        this.guildSettings = guildSettings;

        var battle = guildSettings.get('battle');

        if (battle.users === undefined) {
            console.log("Users not found, creating.");
            battle.users = {};
        }

        if (battle.items === undefined) {
            console.log("Items not found, creating.");
            battle.items = config.items;
        }

        if (battle.levels === undefined) {
            console.log("Levels not found, creating.");
            battle.levels = config.levels;
        }

        if (battle.traps === undefined) {
            console.log("Traps not found, creating.");
            battle.traps = {};
        }

        this.guildSettings.set('battle', battle);
    }

    get settings() { return this.guildSettings.get('battle'); }
    set settings(settings) { this.guildSettings.set('battle', settings); }

    get users() { return this.settings.users; }
    get items() { return this.settings.items; }
    get levels() { return this.settings.levels; }
    get traps() { return this.settings.traps; }

    set users(obj) { var newSettings = this.settings; newSettings.users = obj; this.settings = newSettings; }
    set items(obj) { var newSettings = this.settings; newSettings.items = obj; this.settings = newSettings; }
    set levels(obj) { var newSettings = this.settings; newSettings.levels = obj; this.settings = newSettings; }
    set traps(obj) { var newSettings = this.settings; newSettings.traps = obj; this.settings = newSettings; }

    retrieve(user_id) {
        var users = this.users;

        var stats = users[user_id];

        if (stats === undefined) {
            stats = {
                xp: 0,
                inventory: [
                    this.items.pebble
                ],
                hp: 10
            };

            users[user_id] = stats;

            this.users = users;
        }

        return stats;
    }

    set(user, stats) {
        var users = this.users;
        users[user] = stats;

        this.users = users;
    }

    damage(victimId, damage, attackerId) {
        var victimStats = this.retrieve(victimId);
        var attackerStats = this.retrieve(attackerId);

        if (victimId !== attackerId) {
            attackerStats.xp += damage;
        }

        victimStats.hp -= damage;

        if (victimStats.hp <= 0) {
            victimStats.hp = 0;
        }

        this.set(victimId, victimStats);
        this.set(attackerId, attackerStats);

        return victimStats.hp;
    }

    increaseXp(userId, xpAmount) {
        var userStats = this.retrieve(userId);

        this.set(userId, userStats);
    }

    addTrap(message, phrase, user, callback) {
        var traps = this.traps;
        var key = phrase.toLowerCase();

        if (Object.keys(traps).indexOf(key) > -1) {
            return false;
        }

        var status = this.retrieve(user.id);

        if ('trapActive' in status && status.trapActive) {
            return false;
        }

        traps[key] = this.generateTrap(phrase, user.id, Date.now(), callback, message);

        status.trapActive = true;

        this.traps = traps;

        this.set(user.id, status);

        return true;
    }

    generateTrap(phrase, owner_id, startTime, callback, message) {
        return {
            phrase: phrase,
            ownerId: owner_id,
            startTime: startTime,
            callback: callback,
            messageId: message.id,
            getDamage: function () {
                var hours = Math.floor((Date.now() - this.startTime) / (60 * 60 * 1000));

                var damage = 0;

                for (var i = 0; i < hours; ++i) {
                    ++damage;

                    // 8 Hours
                    if (i >= 8) {
                        ++damage;
                    }
                    // 1 Day
                    if (i >= 24) {
                        ++damage;
                    }
                    // 3 Days
                    if (i >= 72) {
                        ++damage;
                    }
                    // 1 Week
                    if (i >= 168) {
                        ++damage;
                    }
                    // 2 Weeks
                    if (i >= 336) {
                        ++damage;
                    }
                    // 3 Weeks
                    if (i >= 504) {
                        ++damage;
                    }
                    // 4 Weeks
                    if (i >= 672) {
                        ++damage;
                    }
                }

                return damage;
            }
        };
    }

    trapList() {
        return this.traps;
    }

    removeTrap(trapWord) {
        var traps = this.traps;

        var trap = traps[trapWord];

        var status = this.retrieve(trap.ownerId);

        delete traps[trapWord];

        status.trapActive = false;

        this.traps = traps;

        this.set(trap.ownerId, status);

        return trap;
    }

    springTrap(message, trapWord) {
        var trap = this.removeTrap(trapWord);
        var authorId = message.author.id;
        this.damage(authorId, trap.getDamage(), trap.ownerId);

        if (trap !== undefined) {
            trap.callback(trap, message);
        }
    }

    defaultTrapCallback(trap, message) {
        var victim = message.author;
        var owner = message.client.users.get(trap.ownerId);

        var embed = new Discord.RichEmbed()
            .setColor('RED');

        if (owner.id === victim.id) {
            embed.setAuthor(`${owner.username} Blew Themselves Up!`, 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Skull_and_crossbones.svg/2000px-Skull_and_crossbones.svg.png');
        }
        else {
            embed.setAuthor(`${owner.username}'s Trap Sprung!`, owner.avatarUrl);
        }

        var victimStats = this.retrieve(victim.id);

        if (victimStats.hp === 0) {
            embed.setThumbnail('https://www.galabid.com/wp-content/uploads/2017/11/rip-gravestone-md.png');
        }

        embed.setDescription(
            `**Phrase**: ${trap.phrase}\n` +
            `**Owner**: ${owner}\n` +
            `**Damage**: ${trap.getDamage()}\n\n` +
            `**Victim**: ${victim}\n` +
            `**Remaining Health**: ${victimStats.hp}\n\n` +
            `*Traps deal more damage the longer they are alive for.*`);
        embed.setFooter(`Trap set at ${new Date(trap.startTime).toString()}`, owner.avatarUrl);

        message.channel.send(embed);

        var trapChannelID = message.guild.admin.getTrapChannel();

        if (trapChannelID !== null) {
            var channel = message.client.channels.get(trapChannelID);
            channel.send(embed).catch((error) => console.log(error));
        }
    }
};