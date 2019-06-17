const Challonge = require('../core/Challonge');
require('dotenv').config();

var client = new Challonge({}, { apiKey: process.env.CHALLONGE });

console.log(client.createTournament({
    name: 'Test',
    tournament_type: 'single_elimination',
    url: 'test_123',
    subdomain: 'puppybot',
    description: 'testing tournament creation functionality',
    open_signup: false,
    hold_third_place_match: false,
    show_rounds: true,
    // private: true,
    signup_cap: 123
}), (err, data) => console.log(err, data))
console.log(client.getTournaments(), (err, data) => console.log(err, data));