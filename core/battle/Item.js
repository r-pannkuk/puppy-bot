/**
 * @typedef {object} ItemConfig
 * @property {number} id - Unique ID for this item.
 * @property {string} name - Name of this item.
 * @property {string} description - Description with flavor text.
 * @property {string} image - Location of the image used.
 * @property {number} attack - Attack value of the item.
 * @property {number} energy - Total energy cost to use.
 * @property {number} level - Level requirement.
 * @property {number} chance - Weighted chance (used for rolling loot)
 * @property {number} cooldown - Cooldown (in milliseconds) to use the item.
 */

class Item {
    /**
     * 
     * @param {ItemConfig} item Item configuration for reference.
     */
    constructor({
        id,
        name,
        description,
        image,
        attack,
        energy,
        level,
        chance,
        cooldown
    }) {
        /** @type {string} */
        this.id = id;
        /** @type {string} */
        this.name = name;
        /** @type {string} */
        this.description = description;
        /** @type {string} */
        this.image = image;
        /** @type {number} */
        this.attack = attack;
        /** @type {number} */
        this.energy = energy;
        /** @type {number} */
        this.level = level;
        /** @type {number} */
        this.chance = chance;
        /** @type {number} */
        this.cooldown = cooldown;
    }

    /** Item UUID. */
    get id() { return this.id; }
    /** Item name for reference. */
    get name() { return this.name; }
    /** Item's description. */
    get description() { return this.description; }
    /** Source of item image. */
    get image() { return this.image; }
    /** Attack value of this item on use. */
    get attack() { return this.attack; }
    /** Energy cost to use this item. */
    get energy() { return this.energy; }
    /** Level requirement for this item. */
    get level() { return this.level; }
    /** Chance (weight) to roll for this item. */
    get chance() { return this.chance; }
    /** Time (in milliseconds) for this item to be used again. */
    get cooldown() { return this.cooldown; }
}

module.exports = Item;