const BetPool = require('../core/bet/BetPool.js');
const Bet = require('../core/bet/Bet.js');
const User = require('../core/points/User.js');
const Award = require('../core/points/Award.js');
const Source = require('../core/points/Source.js');

const assert = require('assert');

var granter = new User({ _id: 'admin' });
var winner = new User({ _id: 'winner' });
var winner2 = new User({ _id: 'winner2' });
var loser = new User({ _id: 'loser' });

var winnerBaseAward = new Award({
    _granter: granter,
    _amount: 1000,
    _source: new Source({ _id: '1234', _type: Source.TYPE.Custom }),
    _user: winner
});

var winner2BaseAward = new Award({
    _granter: granter,
    _amount: 1000,
    _source: new Source({ _id: '12345', _type: Source.TYPE.Custom }),
    _user: winner2
});

var loserBaseAward = new Award({
    _granter: granter,
    _amount: 1000,
    _source: new Source({ _id: '4567', _type: Source.TYPE.Custom }),
    _user: loser
});


var betPool = new BetPool({
    _owner: granter,
    _options: [true, false]
});

assert.throws(() => {
    var winningBet = new Bet({
        _betPool: betPool,
        _outcome: true,
        _wager: 500,
        _payout: 500,
        _user: winner
    });
});

assert.throws(() => {
    var losingBet = new Bet({
        _betPool: betPool,
        _outcome: false,
        _wager: 500,
        _user: loser
    });
});

betPool.open(granter);

var winningBet = new Bet({
    _betPool: betPool,
    _outcome: true,
    _wager: 500,
    _user: winner
});

var winningBet2 = new Bet({
    _betPool: betPool,
    _outcome: true,
    _wager: 100,
    _user: winner2
})

var losingBet = new Bet({
    _betPool: betPool,
    _outcome: false,
    _wager: 500,
    _user: loser
});

betPool.close();

betPool.complete(granter, true);

betPool.awardAll();

betPool.refundAll();

console.log("Done");