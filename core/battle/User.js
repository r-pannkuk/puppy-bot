const UserStatistics = require('./UserStatistics.js');
const UserInventory = require('./UserInventory.js');

module.exports = class User {
    /**
     * @param {object} config 
     * @param {object} args
     * @param {string} args._id - Unique ID for this user.
     * @param {string} args._description - Description for this user.
     * @param {Date} args._createdAt - Creation date.
     * @param {UserInventory} args._inventory - Inventory for the user, containing all items available.
     * @param {UserStatistics} args._stats - Statistics object for this user; holds all relevant stats.
     * @param {number} args._stats.experience - Experience points for this user.
     * @param {number} args._stats.health - Health points for this user.
     * @param {string[]} args._traps - List of Trap ID's owned by this user.
     */
    constructor(config, {
        _id = null,
        _description = null,
        _createdAt = Date.now(),
        _inventory = {
            _items: []
        },
        _stats = {
            _experience: 0,
            _health: config.levels[0].maxHealth,
            _energy: config.levels[0].maxEnergy
        },
        _lastEdited,
        _lastPelt = Date.now(),
        _traps = []
    }) {
        /** @type {string} */
        
        this._id = _id;
        /** @type {string} */
        this._description = _description;
        /** @type {Date} */
        this._createdAt = _createdAt;
        /** @type {UserInventory} */
        this._inventory = new UserInventory(config.items, _inventory);
        /** @type {UserStatistics} */
        this._stats = new UserStatistics(config.levels, _stats);
        /** @type {Date} */
        this._lastPelt = _lastPelt;
        /** @type {string[]} */
        this._traps = _traps;
        
        /** Regeneration occurs every minute and is based on regen amounts. */
        if(this._stats.health < this._stats.maxHealth) {
            this._stats.health += config.regen.health * (Date.now() - (_lastEdited || 0));

            if(this._stats.health > this._stats.maxHealth) {
                this._stats.health = this._stats.maxHealth;
            }
        }

        if(this._stats.energy < this._stats.maxEnergy) {
            this._stats.energy += config.regen.energy * (Date.now() - (_lastEdited || 0));

            if(this._stats.energy > this._stats.maxEnergy) {
                this._stats.energy = this._stats.maxEnergy;
            }
        }

        /** @type {Date} */
        this._lastEdited = Date.now();
    }

    /** The User's id. */
    get id() { return this._id; }
    /** The User's custom description */
    get description() { return this._description; }
    set description(str) { this._description = str; }
    /** The user's statistics. */
    get stats() { return this._stats; }
    /** The user's current experience. */
    get experience() { return this._stats.experience; }
    set experience(int) { this._stats.experience = int; }
    /** The user's current health. */
    get health() { return Math.floor(this._stats.health); }
    set health(int) { this._stats.health = int; }
    /** The user's current energy. */
    get energy() { return Math.floor(this._stats.energy); }
    set energy(int) { this._stats.energy = int; }
    /** The User's creation date. */
    get createdAt() { return this._createdAt; }
    /** The User's last edit date. */
    get lastEdited() { return this._lastEdited; }
    /** The user's current inventory. */
    get inventory() { return this._inventory; }
    /** The User's last pelt date. */
    get lastPelt() { return this._lastPelt; }
    set lastPelt(d) { this._lastPelt = d; }
    /** The user's current traps. */
    get traps() { return this._traps; }
    /** The user's level. */
    get level() { return this._stats.level; }

    set health(amount) { this._stats.health = amount; }
    set experience(amount) { this._stats.experience = amount; }
}