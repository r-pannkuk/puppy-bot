/** 
 * @typedef {Object} LevelConfig 
 * @property {number} level - Level ID.
 * @property {number} xp - The experience required to reach this level.
 * @property {number} maxTraps - The maximum traps allowed by this level.
 * @property {number} maxHealth - The maximum health allowed by this level.
 * @property {number} maxEnergy - The maximum energy allowed by this level.
*/

/** Object containing all user relevant statistics. */
class UserStatistics {
    /**
     * @param {LevelConfig[]} config 
     * @param {object} args
     * @param {number} args._experience - User's current experience.
     * @param {number} args._health - User's current health.
     * @param {number} args._energy - User's max health.
     * @param {number} args._
     */
    constructor(config, {
        _experience = 0,
        _health = 0,
        _energy = 0
    }) {
        /** @private */
        this._config = config;
        /** @private */
        this._experience = _experience;
        /** @private */
        this._health = _health;
        /** @private */
        this._energy = _energy;
    }

    get levelSchema() {
        return this._config.reduceRight((prev, val) => {
            if (val.xp >= prev.xp && this._experience >= val.xp) {
                return val;
            } else {
                return prev;
            }
        }, { xp: 0 });
    }

    /** User's current level. */
    get level() { return this.levelSchema.level; }
    /** User's current health. */
    get health() { return this._health; }
    set health(int) { this._health = int; }
    /** User's maximum health possible. */
    get maxHealth() { return this.levelSchema.maxHealth; }
    /** User's current experience. */
    get experience() { return this._experience; }
    set experience(int) { this._experience = int; }
    /** User's next level experience required, or null if max level. */
    get nextLevelExperience() {
        var nextLevelSchema = this._config.find(ls => ls.level === this.level + 1);

        if (nextLevelSchema) {
            return nextLevelSchema.xp;
        }

        return null;
    }
    /** User's current energy. */
    get energy() { return this._energy; }
    set energy(int) { this._energy = int; }
    /** User's maximum energy possible. */
    get maxEnergy() { return this.levelSchema.maxEnergy; }
    /** User's maximum allotment for traps. */
    get maxTraps() { return this.levelSchema.maxTraps; }
    /** User's total regeneration amount per tick.  */
}

module.exports = UserStatistics;