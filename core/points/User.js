module.exports = class User {
    constructor({
        _id = null,
        _accounts = [],
        _createdAt = Date.now(),
        _currentBalance = 0,
        _lifetimeBalance = 0,
        _bets = [],
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
    get winningBets() { return this._bets.filter(b => b.result = Bet.RESULT.WON); }
    get received() { return this._changes; }
    get awards() { return this._changes.filter(r => r.amount >= 0); }
    get penalties() { return this._changes.filter(r => r.amount < 0); }
    get grants() { return this._grants; }
    get grantedAwards() { return this._grants.filter(g => g.amount >= 0); }
    get grantedPenalties() { return this._grants.filter(g => g.amount < 0); }

    addPointChange(pointChange) {
        this._changes.push(pointChange.id);
        this._currentBalance += pointChange.amount;

        if(pointChange.amount > 0) this._lifetimeBalance += pointChange.amount;
    }
}