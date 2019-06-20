const Bet = require('./Bet.js');
const uuid = require('uuid/v1');
const emojis = require('./Emojis.js');

class BetPool {
    constructor({
        _id = null,
        _source = null,
        _owner = null,
        _lastEditedBy = null,
        _lastEdited = Date.now(),
        _options = [],
        _winner = null,
        _betSize = 0,
        _bets = {},
        _status = BetPool.STATE.Pending,
        _message = {
            _id: null,
            author: `New Wager`,
            authorIcon: null,
            thumbnail: null,
            closing: `\n\n**React with your choice to enter the bet pool.**`
        }
    }) {
        this._id = _id || uuid();
        this._source = _source;
        this._owner = _owner;
        this._winner = _winner;
        this._lastEditedBy = _lastEditedBy;
        this._lastEdited = _lastEdited;
        this._options = _options;
        this._betSize = _betSize;
        this._bets = _bets;
        this._status = _status;
        this._message = _message;

        this._message.author = this._id;
    }

    static get STATE() {
        return {
            Pending: -1,
            Open: 1,
            Closed: 2,
            Completed: 3,
            Awarded: 4,
            Refunded: 5
        }
    }

    get source() { return this._source; }
    get owner() { return this._owner; }
    get lastUser() { return this._lastEditedBy || this._owner; }
    get options() { return this._options; }
    get bets() { return this._bets; }
    get betSize() { return this._betSize; }
    get currentPool() { return Object.values(this._bets).filter(b => b.status !== Bet.STATUS.Refunded).reduce((prev, curr) => prev + curr._wager, 0); }
    get status() {
        switch (this._status) {
            case BetPool.STATE.Pending:
                return 'Pending';
            case BetPool.STATE.Open:
                return 'Open';
            case BetPool.STATE.Closed:
                return 'Closed';
            case BetPool.STATE.Completed:
                return 'Completed';
            case BetPool.STATE.Awarded:
                return 'Awarded'
            case BetPool.STATE.Refunded:
                return 'Refunded';
        }
    }

    getActiveBet(user_id) {
        return Object.values(this.bets).find((b) => b._user === user_id && b._status === 1);
    }

    getAwardedBets() {
        return Object.values(this.bets).filter(b => b._status === Bet.STATUS.Awarded);
    }

    addBet({
        _user,
        _source,
        _outcome,
        _wager
    }) {
        var bet = new Bet({
            _user: _user,
            _betPool: this._id,
            _source: _source,
            _outcome: _outcome,
            _wager: _wager
        });

        this._bets[bet._id] = bet;

        return bet;
    }

    message() {
        var message = this._message;
        message.description = `**Status**: ${this.status}\n` +
            `**Bet**: ${this.betSize}\n` +
            `**Current Pool**: ${this.currentPool}\n`;

        if(this._winner) {
            message.description += `**WINNER**: ${this._winner}\n`;
        }

        message.description += '\n';

        for (var i in this._options) {
            message.description += `${emojis[parseInt(i) + 1]}: **${this._options[i]}**\n`;
        }

        message.description += this._message.closing;

        message.footer = `Bet pool last updated at ${new Date(this._lastEdited).toString()}`;

        return message;
    }

    updateEditor(modifier) {
        this._lastEditedBy = modifier;
        this._lastEdited = Date.now();
    }

    open(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Open;

        // this._message.author = 'Open Wager';
        this._message.thumbnail = 'https://res.mdpi.com/data/open-peer-review.png';
    }

    close(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Closed;

        // this._message.author = 'Closed Wager';
        this._message.thumbnail = 'https://i0.wp.com/moshekafrica.com/wp-content/uploads/2019/01/no-more-betting.png?resize=200%2C161&ssl=1';
    }

    complete(modifier, winner) {
        this.updateEditor(modifier);
        this._winner = winner;
        this._status = BetPool.STATE.Completed;

        var winningBets = Object.values(this._bets).filter((b) => b._outcome === winner);
        var losingBets = Object.values(this._bets).filter((b) => b._outcome !== winner);

        winningBets.forEach((b) => {
            var bet = new Bet(b);
            bet.win();
            this._bets[bet._id] = bet;
        });
        losingBets.forEach((b) => {
            var bet = new Bet(b);
            bet.lose();
            this._bets[bet._id] = bet;
        });

        // this._message.author = 'Wager Completed';
        this._message.thumbnail = 'https://www.onlygfx.com/wp-content/uploads/2018/04/completed-stamp-3.png';
    }

    awardAll(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Awarded;

        var bets = Object.values(this._bets).map(b => new Bet(b));

        var totalPayout = bets.reduce((sum, b) => sum + b._wager, 0);
        var winningShares = bets.filter((b) => b._status === Bet.STATUS.Won).reduce((sum, bet) => sum + bet._wager, 0);

        if(winningShares === 0) {
            return [];
        }
        
        return bets.map(b => {
            var bet = new Bet(b);
            var award = bet.award(
                parseInt(totalPayout * b._wager / winningShares),
                this.lastUser
            );
            this.bets[b._id] = bet;
            return award;
        });
    }

    refund(user) {
        var bet = this.getActiveBet(user._id);

        bet = new Bet(bet);

        if (bet) {
            var refund = bet.refund(user._id);
            this._bets[bet._id] = bet;
            return refund;
        } else {
            return null;
        }
    }

    refundAll(modifier) {
        this.updateEditor(modifier);
        this._status = BetPool.STATE.Refunded;
        // this._message.author = 'CANCELLED';
        this._message.thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/ProhibitionSign2.svg/1200px-ProhibitionSign2.svg.png';

        return Object.values(this.bets).map(b => {
            var bet = new Bet(b);
            var refund = bet.refund(this.lastUser);
            this.bets[b._id] = bet;
            return refund;
        });
    }
}

module.exports = BetPool;