const Discord = require('discord.js');

const config = require("../commands/pelt/config.json");

class User {
    constructor({
        _id = null,
        _createdAt = Date.now(),
        _inventory = [],
        _stats = { 
            experience: 0, 
            health: 0 
        },
        _traps = []
    }) {
        this._id = _id;
        this._createdAt = _createdAt;
        this._inventory = _inventory;
        this._stats = _stats;
        this._traps = _traps;
    }

    get id() { return this._id; }
    get stats() { return this._stats; }
    get experience() { return this._stats.experience; }
    get health() { return this._stats.health; }
    get createdAt() { return this._createdAt; }
    get inventory() { return this._inventory; }
    get traps() { return this._traps; }

    set stats(obj) { this._stats = obj; }
    set health(amount) { this._stats.health = amount; }
    set experience(amount) { this._stats.experience = amount; }
}

class Trap {
    constructor({
        phrase = null,
        ownerId = null,
        createdAt = Date.now(),
        callback = null,
        messageId = null,
        getDamage = function () {
            var hours = Math.floor((Date.now() - this.createdAt) / (60 * 60 * 1000));

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
    }) {
        this.phrase = phrase;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
        this.callback = callback;
        this.messageId = messageId;
        this.getDamage = getDamage;
    }
}

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

        for(var user in this.users) {
            this.serialize_user(user);
        }

    }

    get settings() { return this.guildSettings.get('battle'); }
    set settings(obj) { this.guildSettings.set('battle', obj); }

    get users() { return this.settings.users; }
    get items() { return this.settings.items; }
    get levels() { return this.settings.levels; }
    get traps() { return this.settings.traps; }

    set users(obj) { var newSettings = this.settings; newSettings.users = obj; this.settings = newSettings; }
    set items(obj) { var newSettings = this.settings; newSettings.items = obj; this.settings = newSettings; }
    set levels(obj) { var newSettings = this.settings; newSettings.levels = obj; this.settings = newSettings; }
    set traps(obj) { var newSettings = this.settings; newSettings.traps = obj; this.settings = newSettings; }

    serialize_user(user_id) {
        var temp = this.users;
        var storedUser = temp[user_id];

        // Creating a user object from existing user, or creating new one if none exists.
        var user = new User(storedUser || {_id: user_id});

        temp[user_id] = user;

        this.users = temp;

        return user;
    }

    retrieve(user_id) {
        var stats = this.users[user_id];

        if (stats === undefined) {
            stats = this.serialize_user(user_id);
        }

        return stats;
    }

    set(user, stats) {
        var temp = this.users;
        temp[user] = stats;

        this.users = temp;
    }

    damage(victimId, damage, attackerId) {
        var victim = this.retrieve(victimId);
        var attacker = this.retrieve(attackerId);

        if (victimId !== attackerId) {
            attacker.experience += damage;
        }

        victim.health -= damage;

        if (victim.health <= 0) {
            victim.health = 0;
        }

        this.set(victimId, victim);
        this.set(attackerId, attacker);

        return victim.health;
    }

    increaseXp(userId, xpAmount) {
        var user = this.retrieve(userId);

        user.experience += xpAmount;

        this.set(userId, user);
    }

    addTrap(messageId, phrase, user, callback) {
        var traps = this.traps;
        var key = phrase.toLowerCase();

        if (Object.keys(traps).indexOf(key) > -1) {
            return false;
        }

        var userObj = this.retrieve(user.id);

        if (userObj.traps.length >= 1) {
            return false;
        }

        traps[key] = new Trap({
            phrase: phrase, 
            user: user.id, 
            createdAt: Date.now(), 
            callback: callback, 
            messageId: messageId
        });

        userObj.traps.push(traps[key]);

        this.traps = traps;

        this.set(user.id, userObj);

        return true;
    }

    trapList() {
        return this.traps;
    }

    removeTrap(trapWord) {
        var traps = this.traps;

        var trap = traps[trapWord];

        var user = this.retrieve(trap.ownerId);

        delete traps[trapWord];

        user.traps.splice(user.traps.indexOf(trapWord), 1);

        this.traps = traps;

        this.set(trap.ownerId, user);

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

        message.channel.send(embed);

        var trapChannelID = message.guild.admin.trapChannelID;

        if (trapChannelID !== null) {
            var channel = message.client.channels.get(trapChannelID);
            channel.send(embed).catch((error) => console.log(error));
        }
    }
};