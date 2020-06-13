const Bet = require('../core/bet/Bet.js');
const BetPool = require('../core/bet/BetPool.js');

var betPool = new BetPool({
    _id: 9,
    _owner: 123,
    _options: [true, false],
    _betSize: 500
})

var bet = new Bet({
    _id: 1,
    _source: {},
    _user: 123,
    _wager: 500,
    _outcome: true
});


betPool.addBet(bet);

betPool.addBet({
    _id: 1,
    _source: {},
    _user: 123,
    _wager: 500,
    _outcome: true
});

