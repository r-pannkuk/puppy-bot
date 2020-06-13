module.exports = class User {
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
    get level() { return }

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