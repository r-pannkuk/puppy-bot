const Discord = require('discord.js');
const uuid = require('uuid/v1');

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

    damage(attacker, amount) {
        if (this.id !== attacker.id) {
            attacker.experience += amount;
        }

        this.health -= amount;

        if (this.health <= 0) {
            this.health = 0;
        }

        return this.health;
    }

    increaseXp(xpAmount) {
        user.experience += xpAmount;
    }
}

class Trap {
    constructor({
        phrase = null,
        user = null,
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
        this.id = uuid();
        this.phrase = phrase;
        this.user = user;
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

        for (var user in this.users) {
            this.serialize_user(user);
        }

    }

    get settings() { return this.guildSettings.get('battle'); }
    set settings(obj) { this.guildSettings.set('battle', obj); }

    get traps() { return this.settings.traps; }
    get users() { return this.settings.users; }

    serialize_user(user_id) {
        var temp = this.settings;
        var storedUser = temp.users[user_id];

        // Creating a user object from existing user, or creating new one if none exists.
        var user = new User(storedUser || { _id: user_id });

        temp.users[user_id] = user;

        this.settings = temp;

        return user;
    }

    retrieve(user_id) {
        var stats = this.users[user_id];

        if (stats === undefined) {
            stats = this.serialize_user(user_id);
        }

        return stats;
    }

    set(user_id, stats) {
        var temp = this.settings;
        temp.users[user_id] = stats;

        this.settings = temp;
    }

    addTrap(message, phrase, user, callback) {
        var temp = this.settings;
        var key = phrase.toLowerCase();

        if (Object.values(temp.traps).find(t => t.phrase.indexOf(key) > -1)) {
            return false;
        }

        var userObj = this.retrieve(user.id);

        if (userObj.traps.length >= 1) {
            return false;
        }

        var newTrap = new Trap({
            phrase: phrase,
            user: userObj,
            createdAt: Date.now(),
            callback: callback,
            messageId: message.id
        });

        temp.traps[newTrap.id] = newTrap;

        userObj.traps.push(newTrap.id);
        temp.users[userObj.id] = userObj;

        this.guildSettings.set('battle', temp);

        return true;
    }

    trapList() {
        return this.settings.traps;
    }

    getTrap(id) {
        return new Trap(this.settings.traps[id]);
    }

    removeTrap(trapWord) {
        var temp = this.settings;
        var trap = Object.values(temp.traps).find(t => t.phrase === trapWord);
        var user = this.retrieve(trap.user._id);

        user.traps.splice(user.traps.indexOf(trap.id), 1);

        delete temp.traps[trap.id];
        temp.users[user.id] = user;

        this.settings = temp;

        return trap;
    }

    springTrap(message, trapWord) {
        var trap = this.removeTrap(trapWord);
        
        var temp = this.settings;
        var owner = this.retrieve(message.author.id);
        var victim = this.retrieve(trap.user.id)

        victim.damage(owner, trap.getDamage());

        if (trap !== undefined) {
            trap.callback(trap, message);
        }

        this.settings = temp;
    }

    defaultTrapCallback(trap, message) {
        var victim = message.author;
        var owner = message.client.users.get(trap.user.id);

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