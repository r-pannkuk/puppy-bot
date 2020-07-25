const UserInventoryItem = require('./UserInventoryItem.js');
const ItemConfig = require('./Item.js')

class UserInventory {
    /**
     * @param {object} config
     * @param {object} args
     * @param {UserInventoryItem[]} args._items 
     */
    constructor(config, {
        _items = [],
    }) {
        /** @private */
        this._items = _items.map(i => new UserInventoryItem(config, i));
    }

    /** All item slots for this user. */
    get items() { return this._items; }

    /** The item last used by the user. */
    get lastUsedItem() { return this._items.sort((a, b) => a.lastUsed - b.lastUsed)[0]; }

    /** Get items available on cooldown. */
    get availableItems() { return this._items.filter(i => i.cooldown === 0); }

    /**
     * Returns the inventory slot associated with an item.
     * @param {ItemConfig} item 
     */
    getInventorySlot(item) {
        return this._items.find(i => i.id = item.id);
    }
}

module.exports = UserInventory;