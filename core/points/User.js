const Award = require('./Award.js');
const Penalty = require('./Penalty.js');
const Account = require('./Account.js');
const Bet = require('../bet/Bet.js');

module.exports = class User {
    constructor({
        _id = null,
        _accounts = [],
        _createdAt = Date.now(),
        _currentBalance = 0,
        _lifetimeBalance = 0,
        _bets = {},
        _changes = [],
        _grants = []
    }) {
        /** @private @type {string} */
        this._id = _id;
        /** @private @type {Account[]} */
        this._accounts = _accounts;
        /** @private @type {Date} */
        this._createdAt = _createdAt;
        /** @private @type {number} */
        this._currentBalance = _currentBalance;
        /** @private @type {number} */
        this._lifetimeBalance = _lifetimeBalance;
        /** @private @type {Object.<string, Bet>} */
        this._bets = _bets;
        /** @private @type {string[]} */
        this._changes = _changes;
        /** @private @type {string[]} */
        this._grants = _grants;
    }

    get id() { return this._id; }
    get accounts() { return this._accounts; }
    get createdAt() { return this._createdAt; }
    get currentBalance() { return this._currentBalance; }
    get lifetimeBalance() { return this._lifetimeBalance; }
    get bets() { return this._bets; }
    get received() { return this._changes; }
    get grants() { return this._grants; }
}