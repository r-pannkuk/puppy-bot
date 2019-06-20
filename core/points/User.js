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
        this._id = _id;
        this._accounts = _accounts;
        this._createdAt = _createdAt;
        this._currentBalance = _currentBalance;
        this._lifetimeBalance = _lifetimeBalance;
        this._bets = _bets;
        this._changes = _changes;
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