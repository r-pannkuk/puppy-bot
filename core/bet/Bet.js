const PointChange = require('../points/PointChange.js');
const Award = require('../points/Award.js');
const Source = require('../points/Source.js');
const assert = require('assert');
const User = require('../points/User.js');

module.exports = class Bet extends PointChange {
    constructor({
        _id = null,
        _betPool = null,
        _user = null,
        _wager = 0,
        _payout = 0,
        _outcome = null,
        _source = null,
        _status = Bet.STATUS.Pending
    }) {
        super({
            _id,
            _user,
            _amount: -1 * _wager,
            _source,
            _type: PointChange.TYPE.Bet
        });

        this._betPool = _betPool;
        this._wager = _wager;
        this._payout = _payout;
        this._outcome = _outcome;
        this._status = _status;
    }

    static get STATUS() {
        return {
            Pending: 1,
            Lost: 2,
            Won: 3,
            Awarded: 6,
            Refunded: 7
        }
    }

    get active() { return this._status === Bet.STATUS.Pending; }
    get status() { return this._status; }

    win() {
        if (!this.active) return;

        this._status = Bet.STATUS.Won;
    }

    lose() {
        if (!this.active) return;

        this._status = Bet.STATUS.Lost;
    }

    award(payout, granter) {
        if (this._status !== Bet.STATUS.Won) return;

        this._status = Bet.STATUS.Awarded;
        this._payout = payout;

        var award = new Award({
            _granter: granter,
            _user: this._user,
            _amount: payout,
            _source: new Source({
                _type: Source.TYPE.Bet,
                _id: this._id
            })
        });

        return award;
    }

    refund(granter) {
        if (!this.active) return;

        this._status = Bet.STATUS.Refunded;

        var award = new Award({
            _granter: granter,
            _user: this._user,
            _amount: this._wager,
            _type: PointChange.TYPE.Refund,
            _source: new Source({
                _type: Source.TYPE.Bet,
                _id: this._id
            })
        });

        return award;
    }
}