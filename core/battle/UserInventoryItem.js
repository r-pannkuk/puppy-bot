const Item = require('./Item.js');

class UserInventoryItem {
    /**
     * 
     * @param {Item[]} _config - Injected config which will read item data.
     * @param {object} args - Arguments object.
     * @param {string} args._id - Item ID
     * @param {Date} args._lastUsed - Last used date (used for cooldowns).
     * @param {Date} args._acquired - Acquisition date.
     * @param {number} args._quantity - Number of the item available.
     */
    constructor(_config, {
        id = null,
        _lastUsed = new Date(),
        _acquired = new Date(),
        _quantity = 1
    }) {
        /** 
         * @private
         * @type {Item[]}
        */
        this._config = _config;
        /** @private */
        this.id = id;
        /** @private */
        this._lastUsed = _lastUsed;
        /** @private */
        this._acquired = _acquired;
        /** @private */
        this._quantity = _quantity;
    }

    /** Last used date. */
    get lastUsed() { return this._lastUsed; }
    set lastUsed(d) { this._lastUsed = d; }

    /** Acquisition date. */
    get acquired() { return this._acquired; }
    set acquired(d) { this._acquired = d; }

    /** Number of items stored in this slot. */
    get quantity() { return this._quantity; }
    set quantity(int) { this._quantity = int; }

    /** Item currently in inventory. */
    get schema() { 
        return this._config.find(i => i.id === this.id); 
    }

    /** Remaining cooldown for the item. */
    get cooldown() {
        if (!this.schema) {
            return null;
        }

        var remainingCooldown = this.schema.cooldown - (Date.now() - this._lastUsed);

        if(remainingCooldown < 0) {
            remainingCooldown = 0;
        }

        return remainingCooldown;
    }
}

module.exports = UserInventoryItem;