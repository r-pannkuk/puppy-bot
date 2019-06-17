const User = require('./User.js');
const Bet = require('./Bet.js');
const Penalty = require('./Penalty.js');
const Award = require('./Award.js');

var util = require('util');

module.exports = class Points {
    constructor(guildSettings) {
        if (guildSettings.get('points') === undefined) {
            console.log("Point settings not found, creating.");
            guildSettings.set('points', {
                users: {},
                awards: {},
                penalties: {},
                bets: {}
            });
        }

        this.guildSettings = guildSettings;
    }

    get settings() { return this.guildSettings.get('points'); }
    set settings(obj) { return this.guildSettings.set('points', obj); }


    _serialize(system, generator, id) {
        var stored = generator(system[id] || { _id: id });
        system[id] = stored;
        return stored;
    }

    _serializeUser(user_id) { return this._serialize(this.settings.users, (obj) => new User(obj), user_id); }
    _serializeAward(award_id) { return this._serialize(this.settings.awards, (obj) => new Award(obj), award_id); }
    _serializePenalty(penalty_id) { return this._serialize(this.settings.penalties, (obj) => new Penalty(obj), penalty_id); }
    _serializeBet(bet_id) { return this._serialize(this.settings.bets, (obj) => new Bet(obj), bet_id); }

    getUser(discordUser) {
        return this._serializeUser(discordUser.id);
    }

    awardUser(discordUser, discordGranter, amount, source) {
        var settings = this.settings;

        var user = this._serializeUser(discordUser.id);

        if (discordUser.id === discordGranter.id) {
            var granter = user;
        } else {
            var granter = this._serializeUser(discordGranter.id);
        }

        var award = new Award({
            _amount: amount,
            _source: source,
            _user: user,
            _granter: granter
        });

        settings.users[user.id] = user;
        settings.users[granter.id] = granter;
        settings.awards[award.id] = award;

        this.settings = settings;

        return award;
    }

    penalizeUser(discordUser, discordGranter, amount, source) {
        var settings = this.settings;

        var user = this._serializeUser(discordUser.id);

        if (discordUser.id === discordGranter.id) {
            var granter = user;
        } else {
            var granter = this._serializeUser(discordGranter.id);
        }

        var penalty = new Penalty({
            _amount: amount * -1,
            _source: source,
            _user: user,
            _granter: granter
        });

        settings.users[user.id] = user;
        settings.users[granter.id] = granter;
        settings.penalties[penalty.id] = penalty;

        this.settings = settings;

        return penalty;
    }
}