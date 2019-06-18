const PointChange = require('./PointChange.js');
const Award = require('./Award.js');
const BetPool = require('./BetPool.js');
const Source = require('./Source.js');
const assert = require('assert');

class Bet extends PointChange {
    constructor({
        _betPool = null,
        _user = null,
        _wager = 0,
        _payout = 0,
        _outcome = null,
        _source = null,
        _status = Bet.STATUS.Pending
    }) {
        assert(_betPool.options.any(o => _outcome === o), 'Bets must use an option from the betting pool.');
        assert(_betPool._status === 1, 'Bets cannot be added to unopen Bet Pools.');
        assert(_user.currentBalance >= _wager, 'A user cannot bet more than they have.');

        super({
            _user,
            _amount: -1 * _wager,
            _source,
            _type: PointChange.TYPE.Bet
        });

        this._betPool = _betPool._id;
        this._wager = _wager;
        this._payout = _payout;
        this._outcome = _outcome;
        this._status = _status;

        this._user.bets.push(this);
        _betPool.bets.push(this);
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

    award({payout, granter = owner}) {
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

        this._status = STATUS.Refunded;

        var award = new Award({
            _granter: granter,
            _user: this._user,
            _amount: this._wager,
            _source: new Source({
                _type: Source.TYPE.Bet,
                _id: this._id
            })
        });

        return award;
    }
}

module.exports = Bet;