const Discord = require('discord.js');

const config = require('./config.json')
const Item = require('./Item.js');
const Trap = require('./Trap.js');
const User = require('./User.js');
const RichEmbedBuilder = require('./RichEmbedBuilder.js');
const UserInventoryItem = require('./UserInventoryItem');
const UserStatistics = require('./UserStatistics');

/** @typedef {import('./Item.js').ItemConfig} ItemConfig */
/** @typedef {import('./UserStatistics.js').LevelConfig} LevelConfig */

module.exports = class BattleSystem {
    /**
     * 
     * @param {object} guildSettings 
     * @param {Discord.Client} guildSettings.client
     * @param {Discord.Guild} guildSettings.guild 
     */
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


        if (battle.traps === undefined) {
            console.log("Traps not found, creating.");
            battle.traps = {};
        }

        this.guildSettings.set('battle', battle);

        /** @private */
        this._config = config;

        for (var user in this.users) {
            this._serializeUser(user);
        }

    }

    get settings() { return this.guildSettings.get('battle'); }
    set settings(obj) { this.guildSettings.set('battle', obj); }

    /** Returns the config variants for all items used in the battle system.
     * @type {ItemConfig[]} 
     */
    get items() { return this._config.items; }

    /** 
     * Returns the config variants for all levels used in the battle system.
     * @type {LevelConfig[]} 
     */
    get levels() { return this._config.levels; }

    /**
     * List of all traps active in the battle system.
     * @type {Object.<string, Trap} 
     */
    get traps() { return this.settings.traps; }

    /** 
     * List of users in the battle system. 
     * @type {Object.<string, User} 
     */
    get users() { return this.settings.users; }


    /**
     * Serializes a user, creating a user object out of them.
     * @param {User|Discord.GuildMember|Discord.User|string} user The user to serialize.
     */
    _serializeUser(user) {
        var temp = this.settings;

        if (user instanceof Discord.User || user instanceof Discord.GuildMember) {
            var userObj = temp.users[user.id];
            user = user.id;
        } else if (typeof (user) === 'string') {
            var userObj = temp.users[user];
        } else {
            var userObj = user;
            user = user.id;
        }

        // Creating a user object from existing user, or creating new one if none exists.
        var userObj = new User(this._config, userObj || {
            _id: user, _stats: {
                _energy: this._config.levels[0].maxEnergy,
                _health: this._config.levels[0].maxHealth,
                _experience: 0
            }
        });

        temp.users[userObj.id] = userObj;

        /* Removing configs from stored object. */
        delete temp.users[userObj.id]._stats._config;
        temp.users[userObj.id]._inventory._items.forEach(i => delete i._config)

        this.settings = temp;

        /* New User object with config intact for manipulation. */
        return new User(this._config, userObj);
    }

    /**
     * Fetches a user's data for manipulation or reading.
     * @param {User|Discord.User|string} user The user to fetch.
     */
    fetch(user) {
        if (user instanceof Discord.User || user instanceof User) {
            user = user.id;
        }

        return this._serializeUser(user);;
    }

    /**
     * 
     * @param {User} user - Which user to grant experience.
     * @param {number} amount - How much experience to grant.
     */
    addExperience(user, amount) {
        user = new User(this._config, user);

        var beforeStats = new UserStatistics(this._config.levels, user.stats);

        user.stats.experience += amount;

        user = this._serializeUser(user);

        var guildMember = this.guildSettings.guild.members.get(user.id);

        if (beforeStats.level < user.stats.level) {
            this.guildSettings.client.emit('userLevelUp', guildMember, user, beforeStats);
        }

        return user;
    }

    /**
     * Damages a user.
     * @param {User} attacker 
     * @param {User} victim 
     * @param {number} amount 
     */
    damageUser(attacker, victim, amount) {
        attacker = new User(this._config, attacker);
        victim = new User(this._config, victim);

        var beforeHealth = victim.health;
        var experience = amount;
        victim.health -= amount;

        if (victim.health <= 0) {
            experience = beforeHealth;
            victim.health = 0;

            var victimGuildMember = this.guildSettings.guild.members.get(victim.id);
            var attackerGuildMember = this.guildSettings.guild.members.get(attacker.id);

            this.guildSettings.client.emit(`userDeath`, victimGuildMember, victim, attacker, attackerGuildMember, amount);
        }

        victim = this._serializeUser(victim);

        /** Checking for self-harm (no experience rewarded if so). */
        if (attacker.id === victim.id) {
            attacker = victim;
        } else {
            attacker = this.addExperience(attacker, experience);
        }

        return {
            attacker: attacker,
            victim: victim
        };
    }

    /**
     * Damages a user using an item.
     * @param {User} attacker The person using the item.
     * @param {User} victim The person having the item used against.
     * @param {ItemConfig} item The Item schema for the item being used.
     * @return {{attacker:User, victim:User, item:UserInventoryItem}}
     */
    useItem(attacker, victim, item) {
        attacker = this._serializeUser(attacker); 
        victim = this._serializeUser(victim);

        if(item instanceof UserInventoryItem) {
            item = item.schema;
        }

        attacker.energy -= item.energy;

        if (attacker.energy < 0) {
            attacker.energy = 0;
        }

        attacker.inventory._items.find(i => i.id === item.id).lastUsed = Date.now();

        if (attacker.id === victim.id) {
            var damageEvent = this.damageUser(attacker, attacker, item.attack);
        } else {
            var damageEvent = this.damageUser(attacker, victim, item.attack);
        }

        return {
            ...damageEvent,
            item: damageEvent.attacker.inventory.getInventorySlot(item)
        }
    }

    /**
     * Pelts a new item, adds it to the user's inventory and damages.
     * @param {User|Discord.User|string} attacker 
     * @param {User|Discord.User|string} victim 
     */
    peltUser(attacker, victim) {
        victim = this.
            _serializeUser(victim);
        attacker = this._serializeUser(attacker);

        /** @type {ItemConfig[]} */
        var config = this._config.items;
        var choices = config.filter(ic => ic.level <= attacker.level);

        /** Rollng against all items that are qualified for. */
        var roll = Math.floor(Math.random() * choices.reduce((prev, i) => prev + i.chance, 0));

        var totalWeight = 0;

        /** Find the first choice that matches our roll. */
        for (var i in choices) {
            var choice = choices[i];

            totalWeight += choice.chance;

            if (totalWeight >= roll) {
                break;
            }
        }

        /** Checking if attacker has this item already in their inventory. */
        var invItem = attacker.inventory._items.find(i => i.id === choice.id);
        var peltEvent = {
            isNew: false
        };

        if (!invItem) {
            invItem = new UserInventoryItem(this._config.items, choice);
            attacker.inventory._items.push(invItem);
            peltEvent.isNew = true;
        }

        attacker.lastPelt = Date.now();

        var useEvent = this.useItem(attacker, victim, invItem.schema);

        return {
            ...useEvent,
            ...peltEvent
        };
    }

    /**
     * Adds a trapped phrase under a user which will fire when spoken.
     * @param {Discord.Message} message The message used to entrap with.
     * @param {string} phrase The specific phrase for entrapping.
     * @param {Discord.User|string} user The user who authored the trap.
     * @param {function} callback Callback function for trap firing.
     */
    addTrap(message, phrase, user, callback) {
        if (user instanceof Discord.User || user instanceof Discord.GuildMember) {
            user = user.id;
        }

        var temp = this.settings;
        var key = phrase.toLowerCase();

        if (Object.values(temp.traps).find(t => t.phrase.toLowerCase() === key)) {
            return false;
        }

        var userObj = this._serializeUser(user);

        if (userObj.traps.length >= userObj._stats.maxTraps) {
            return false;
        }

        var newTrap = new Trap({
            phrase: phrase,
            userid: user,
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

    /**
     * Returns a trap by its id.
     * @param {string} id The trap's ID.
     */
    getTrapByID(id) {
        return new Trap(this.traps[id]);
    }

    /**
     * Removes a trap with the specific phrase.
     * @param {string} trapPhrase 
     */
    removeTrap(trapPhrase) {
        var temp = this.settings;
        var trap = new Trap(Object.values(temp.traps).find(t => t.phrase === trapPhrase));
        var user = this._serializeUser(trap.userid);

        user.traps.splice(user.traps.indexOf(trap.id), 1);

        delete temp.traps[trap.id];
        temp.users[user.id] = user;

        this.settings = temp;

        return trap;
    }

    /**
     * Springs a trap, exploding and damaging a user.
     * @param {Discord.Message} message 
     * @param {string} trapPhrase 
     */
    springTrap(message, trapPhrase) {
        var trap = this.removeTrap(trapPhrase);

        var temp = this.settings;
        var owner = this._serializeUser(message.author.id);
        var victim = this._serializeUser(trap.userid)

        this.damageUser(owner, victim, trap.getDamage());

        if (trap !== undefined) {
            var victimStats = this._serializeUser(victim.id);

            var embed = RichEmbedBuilder.trapTriggered(trap, message, victimStats);

            message.channel.send(embed);

            var trapChannelID = message.guild.admin.trapChannelID;

            if (trapChannelID !== null) {
                var channel = message.client.channels.get(trapChannelID);
                channel.send(embed).catch((error) => console.log(error));
            }
        }

        this.settings = temp;
    }
};