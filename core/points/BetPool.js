const Discord = require('discord.js');
const Source = require('./Source.js');
const Bet = require('./Bet.js');
const uuid = require('uuid/v1');

class BetPool {
    constructor({
        _message = null,
        _source = null,
        _owner = null,
        _lastEditedBy = null,
        _lastEdited = Date.now(),
        _options = [],
        _betSize = 0,
        _bets = [],
        _status = BetPool.STATE.Pending
    }) {
        this._id = uuid();
        this._message = _message;
        this._source = _source;
        this._owner = _owner;
        this._lastEditedBy = _lastEditedBy;
        this._lastEdited = _lastEdited;
        this._options = _options;
        this._betSize = _betSize;
        this._bets = _bets;
        this._status = _status;
    }

    static get STATE() {
        return {
            Pending: -1,
            Open: 1,
            Closed: 2,
            Awarded: 3,
            Refunded: 4
        }
    }

    get message() { return this._message; }
    get source() { return this._source; }
    get owner() { return this._owner; }
    get lastUser() { return this._lastEditedBy || this._owner; }
    get options() { return this._options; }
    get bets() { return this._bets; }
    get betSize() { return this._betSize; }
    get status() {
        switch (this._status) {
            case BetPool.STATE.Pending:
                return 'Pending';
            case BetPool.STATE.Open:
                return 'Open';
            case BetPool.STATE.Closed:
                return 'Closed';
            case BetPool.STATE.Awarded:
                return 'Awarded;'
            case BetPool.STATE.Refunded:
                return 'Refunded';
        }
    }

    updateEditor(modifier) {
        this._lastEditedBy = modifier;
        this._lastEdited = Date.now();
    }

    open(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Open;
    }

    close(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Closed;
    }

    complete(modifier, condition) {
        this.updateEditor(modifier);

        var winningBets = this._bets.filter((b) => b._outcome === condition);
        var losingBets = this._bets.filter((b) => b._outcome !== condition);

        winningBets.forEach((b) => b.win());
        losingBets.forEach((b) => b.lose());
    }

    awardAll() {
        var totalPayout = this._bets.reduce((sum, b) => sum + b._wager, 0);
        var individualPayout = Math.floor(totalPayout / this._bets.length);

        this._bets.forEach((b) => b.award({
            payout: individualPayout,
            granter: this.lastUser
        }));

        this._status = BetPool.STATE.Awarded;
    }

    refundAll() {
        this._bets.forEach((b) => b.refund(this.lastUser));

        this._status = BetPool.STATE.Refunded;
    }
}

module.exports = BetPool;