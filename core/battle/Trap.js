const uuid = require('uuid/v1');

module.exports = class Trap {
    constructor(_config, {
        _id = uuid(),
        _phrase = null,
        _owner = null,
        _victim = null,
        _createdAt = Date.now(),
        _firedAt = null,
        _messageId = null
    }) {
        /** @private */
        this._config = _config;

        /** @private @type {string} */
        this._id = _id;
        /** @private @type {string} */
        this._phrase = _phrase;
        /** @private @type {string} */
        this._owner = _owner;
        /** @private @type {string} */
        this._victim = _victim;
        /** @private @type {Date} */
        this._createdAt = _createdAt;
        /** @private @type {Date} */
        this._firedAt = _firedAt;
        /** @private @type {string} */
        this._messageId = _messageId;
    }

    /** Unique trap ID. */
    get id() { return this._id; }
    /** Trap pharse. */
    get phrase() { return this._phrase; }
    /** User ID of the owner. */
    get owner() { return this._owner; }
    /** Creation date. */
    get createdAt() { return this._createdAt; }
    /** Firing date (for inactive traps). */
    get firedAt() { return this._firedAt; }
    /** Message ID of the trap initiation. */
    get messageId() { return this._messageId; }
    /** Calculates the trap's damage based on current trap methodology. */
    get damage() {
        var firedAt = this._firedAt || Date.now();

        var lifetime = (firedAt - this._createdAt);

        var timeIncrementals = Object.entries(this._config.timeIncrementals)
        .map(k => [parseInt(k[0]), parseFloat(k[1])])
        .sort((a, b) => a[0] - b[0]);

        var damage = 0;

        while(lifetime > 0) {
            if(timeIncrementals.length > 0) {
                var incremental = timeIncrementals.shift();
                var incrementalThreshold = incremental[0];
                var incrementalDamage = incremental[1];
            }

            var remainingTime = incrementalThreshold - lifetime;

            if(remainingTime < 0) {
                remainingTime = 0;
            }

            damage += incrementalDamage * (incrementalThreshold - remainingTime);

            lifetime -= incrementalThreshold;
        }

        damage *= this._config.wordMultiplier;

        return Math.floor(damage);
    }
}