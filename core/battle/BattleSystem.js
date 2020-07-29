const Discord = require('discord.js');
const commando = require('discord.js-commando');

const config = require('./config.json')
const Item = require('./Item.js');
const Trap = require('./Trap.js');
const User = require('./User.js');
const RichEmbedBuilder = require('./RichEmbedBuilder.js');
const UserInventoryItem = require('./UserInventoryItem');
const UserStatistics = require('./UserStatistics');

/** @typedef {import('./Item.js').ItemConfig} ItemConfig */
/** @typedef {import('./UserStatistics.js').LevelConfig} LevelConfig */

/**
 * @event trapTrigger
 * @param {Trap} trap The trap that fired.
 * @param {Discord.Message} message The triggering message.
 * @param {User} victim The victim who triggered.
 * @param {User} attacker The user who set the trap to begin with.
 */

/**
 * @typedef {Object} TopRankings
 * @property {Trap[]} traps
 * @property {User[]} users
 */

/**
 * @typedef {Object} BattleSystemSettings
 * @property {Object.<string, Trap>} traps
 * @property {Object.<string, User>} users
 * @property {TopRankings} topRankings
 */


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

        /** @type {BattleSystemSettings} */
        var battle = guildSettings.get('battle');

        if (battle.users === undefined) {
            console.log("Users not found, creating.");
            battle.users = {};
        }


        if (battle.traps === undefined) {
            console.log("Traps not found, creating.");
            battle.traps = {};
        }


        if (battle.topRankings === undefined) {
            console.log("Top rankings not found, creating.")
            battle.topRankings = {};
        }

        {
            if (battle.topRankings.traps === undefined) {
                console.log("Top traps list not found, creating");
                battle.topRankings.traps = [];
            }

            if (battle.topRankings.users === undefined) {
                console.log("Top users list not found, creating");
                battle.topRankings.users = [];
            }
        }

        this.guildSettings.set('battle', battle);

        /** @private */
        this._config = config;

        for (var user in battle.users) {
            this._serializeUser(user);
        }

    }

    /** @type {BattleSystemSettings} */
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
     * @type {Trap[]}
     */
    get traps() { return Object.values(this.settings.traps).map(t => new Trap(this._config.traps, t)); }

    /** 
     * List of users in the battle system. 
     * @type {User[]}
     */
    get users() { return Object.values(this.settings.users).map(u => new User(this._config, u)); }

    /**
     * List of top traps in the rankings.
     */
    get topTraps() { return this.settings.topRankings.traps.map(t => new Trap(this._config.traps, t)); }

    /**
     * List of top users in the rankings.
     */
    get topUsers() { return this.settings.topRankings.users.map(u => new User(this._config, u)); }

    /**
     * Gets the top rankings for the battle system.
     */
    get topRankings() {
        return {
            traps: this.topTraps,
            users: this.topUsers
        };
    }


    /**
     * Serializes a user, creating a user object out of them.
     * @param {User|Discord.GuildMember|Discord.User|string} user The user to serialize.
     * @private
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
        temp.users[userObj.id]._inventory._items.forEach(i => delete i._config);

        temp.topRankings.users.push(temp.users[userObj.id])

        temp.topRankings.users = temp.topRankings.users
            .filter((v, i, s) => s.findIndex(a => a.id === v.id) === i)
            .map(u => new User(this._config, u))
            .sort((a, b) => b.experience - a.experience);
        temp.topRankings.users.splice(this._config.topRankings.userContainerSize);
        temp.topRankings.users.forEach((u, i) => {
            delete temp.topRankings.users[i]._stats.config;
            delete temp.topRankings.users[i]._inventory._items.forEach(i => delete i._config);
        });

        this.settings = temp;


        /* New User object with config intact for manipulation. */
        return new User(this._config, userObj);
    }

    /**
     * Serializes a trap, creating a trap objecct from the input.
     * @param {Trap|string} trap The user to serialize.
     * @private
     */
    _serializeTrap(trap) {
        var temp = this.settings;

        if (trap instanceof Trap) {
            var trap = temp.traps[trap.id];
        } else if (typeof (trap) === 'string') {
            var trap = temp.traps[trap];
        }

        // Creating a trap object from existing trap, or creating new one if none exists.
        var trapObj = new Trap(this._config.traps, trap);

        temp.traps[trapObj.id] = trapObj;

        /* Removing configs from stored object. */
        delete temp.traps[trapObj.id]._config;

        this.settings = temp;

        /* New User object with config intact for manipulation. */
        return new Trap(this._config.traps, trapObj);
    }

    /**
     * Fetches a user's data for manipulation or reading.
     * @param {User|Discord.User|string} user The user to fetch.
     */
    fetchUser(user) {
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
        user = this._serializeUser(user);

        var beforeStats = new UserStatistics(this._config.levels, user.stats);

        user.stats.experience += amount;

        if (beforeStats.level < user.stats.level) {
            user.stats.health = user.stats.maxHealth;
            user.stats.energy = user.stats.maxEnergy;
        }

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
     * 
     * @param {Discord.User|Discord.GuildMember|User|string} user 
     * @param {number} amount The number of energy to consume
     * @param {Function} callback Compute any callback upon energy being consumed.
     * @emits userUseEnergy
     */
    useEnergy(user, amount, callback) {
        var user = this._serializeUser(user);

        user.energy -= amount;

        if (user.energy < 0) {
            user.energy = 0;
        }

        this._serializeUser(user);

        var payload = callback(user, amount);

        this.guildSettings.client.emit('userUseEnergy', user, amount, payload);

        return payload;
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

        if (item instanceof UserInventoryItem) {
            item = item.schema;
        }

        return this.useEnergy(attacker, item.energy, (user, eenrgy) => {
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
        });
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
     * @param {string|Discord.Message} _messageId The message used to entrap with.
     * @param {string} _phrase The specific phrase for entrapping.
     * @param {string|Discord.User} _owner The user who authored the trap.
     */
    addTrap({ _messageId, _phrase, _owner }) {
        if (_owner instanceof User ||
            _owner instanceof Discord.User ||
            _owner instanceof Discord.GuildMember) {
            _owner = _owner.id;
        }

        if (_messageId instanceof Discord.Message ||
            _messageId instanceof commando.CommandMessage) {
            _messageId = _messageId.id;
        }

        var key = _phrase.toLowerCase();

        if (this.traps.find(t => t.phrase.toLowerCase() === key)) {
            return { error: `Trap was already found.` };
        }

        var userObj = this._serializeUser(_owner);

        if (userObj.traps.length >= userObj._stats.maxTraps) {
            return { error: `You have too many traps already.  Please type !removetrap to remove the most recent one.` };
        }

        return this.useAbility(userObj, 'trap', 1, (user, energy) => {
            var newTrap = this._serializeTrap({
                _phrase: _phrase,
                _owner: _owner,
                _createdAt: Date.now(),
                _messageId: _messageId
            });

            user.traps.push(newTrap.id);

            this._serializeUser(user);

            return newTrap;
        });
    }

    /**
     * Returns a trap by its id.
     * @param {string} id The trap's ID.
     */
    getTrapByID(id) {
        return this._serializeTrap(id);
    }

    /**
     * Removes a trap from use.
     * @param {Trap|string} trap Trap object or trap id string.
     */
    removeTrap(trap) {
        var trap = this._serializeTrap(trap);
        var user = this._serializeUser(trap.owner);

        user.traps.splice(user.traps.indexOf(trap.id), 1);

        user.energy += this._config.abilities.trap.energy;
        if (user.energy > user.stats.maxEnergy) {
            user.energy = user.stats.maxEnergy;
        }

        this._serializeUser(user);

        var temp = this.settings;
        delete temp.traps[trap.id];
        this.settings = temp;

        return trap;
    }

    /**
     * Springs a trap, exploding and damaging a user.
     * @param {Discord.Message} message 
     * @param {Trap|string} trap
     * @fires trapTrigger
     */
    springTrap(message, trap) {
        var trap = this.removeTrap(trap);
        var owner = this._serializeUser(trap.owner)
        var victim = this._serializeUser(message.author.id);

        var damageEvent = this.damageUser(owner, victim, trap.damage);

        trap._firedAt = Date.now();
        trap._victim = victim.id;

        this.guildSettings.client.emit('trapTrigger', trap, message, damageEvent.victim, damageEvent.attacker);

        delete trap._config;

        var temp = this.settings;

        temp.topRankings.traps.push(trap);
        temp.topRankings.traps = temp.topRankings.traps
            .filter((v, i, s) => s.findIndex(a => a.id === v.id) === i)
            .map(t => new Trap(this._config.traps, t))
            .sort((a, b) => b.damage - a.damage);
        temp.topRankings.traps.splice(this._config.topRankings.trapContainerSize);
        temp.topRankings.traps.forEach((t, i) => delete temp.topRankings.traps[i]._config)

        this.settings = temp;
    }


    /**
     * 
     * @param {Discord.User|Discord.GuildMember|User|string} userObj The use to act with.
     * @param {string} abilityName What ability to use.
     */
    useAbility(userObj, abilityName, amount, callback) {
        var userObj = this._serializeUser(userObj);
        var ability = Object.values(this._config.abilities).find(a => a.name === abilityName);

        var totalCost = Math.ceil(ability.energy * amount);

        if (userObj.energy < totalCost) {
            return { error: `You do not have enough energy to use ${ability.name}${(amount > 1) ? ` (${amount})` : ``}. [Current Energy: ${userObj.energy}; Requires: ${totalCost}]` };
        }

        return this.useEnergy(userObj, totalCost, callback);
    }
};