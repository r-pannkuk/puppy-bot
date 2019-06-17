const User = require('./User.js');
const Bet = require('./Bet.js');
const Penalty = require('./Penalty.js');
const Award = require('./Award.js');

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

    get OBJECTTYPE() {
        return {
            User: {
                generator: (obj) => new User(obj),
                getter: () => this.users,
                setter: (obj) => this.users = obj
            },
            Bet: {
                generator: (obj) => new Bet(obj),
                getter: () => this.bets,
                setter: (obj) => this.bets = obj
            },
            Award: {
                generator: (obj) => new Award(obj),
                getter: () => this.awards,
                setter: (obj) => this.awards = obj
            },
            Penalty: {
                generator: (obj) => new Penalty(obj),
                getter: () => this.penalties,
                setter: (obj) => this.penalties = obj
            }
        };
    }

    get settings() { return this.guildSettings.get('points'); }
    set settings(settings) { this.guildSettings.set('points', settings); }

    get users() { return this.settings.users; }
    set users(obj) { var newSettings = this.settings; newSettings.users = obj; this.settings = newSettings; }

    get awards() { return this.settings.awards; }
    set awards(obj) { var newSettings = this.settings; newSettings.awards = obj; this.settings = newSettings; }

    get penalties() { return this.settings.penalties; }
    set penalties(obj) { var newSettings = this.settings; newSettings.penalties = obj; this.settings = newSettings; }

    get betPools() { return this.settings.bets; }
    set betPools(obj) { var newSettings = this.settings; newSettings.betPools = obj; this.settings = newSettings; }

    _serialize(type, id) {
        var system = type.getter();
        var stored = type.generator(system[id]);
        system[id] = stored;
        type.setter(system);
        return stored;
    }

    _serializeUser(user_id) { this._serialize(OBJECTTYPE.User, user_id); }
    _serializeAward(award_id) { this._serialize(OBJECTTYPE.Award, award_id); }
    _serializePenalty(penalty_id) { this._serialize(OBJECTTYPE.Penalty, penalty_id); }
    _serializeBet(bet_id) { this._serialize(OBJECTTYPE.Bet, bet_id); }

    _retrieve(type, id) {
        var system = type.getter();
        var stats = type.generator(system[id]);
        if (stats === undefined) {
            stats = this.serialize(type, id);
        }
        return stats;
    }

    _retrieveUser(user_id) { this._retrieve(OBJECTTYPE.USER, user_id); }
    _retrieveAward(award_id) { this._retrieve(OBJECTTYPE.Award, award_id); }
    _retrievePenalty(penalty_id) { this._retrieve(OBJECTTYPE.Penalty, penalty_id); }
    _retrieveBet(bet_id) { this._retrieve(OBJECTTYPE.Bet, bet_id); }

    _set(type, obj) {
        var system = type.getter();
        system[obj.id] = obj;
        type.setter(system);
    }

    _setUser(user) { this._set(OBJECTTYPE.User, user); }
    _setAward(award) { this._set(OBJECTTYPE.Award, award); }
    _setPenalty(penalty) { this._set(OBJECTTYPE.Penalty, penalty); }
    _setBet(bet) { this._set(OBJECTTYPE.Bet, bet); }

    awardUser(discordUser, discordGranter, amount, source) {
        var user = this._retrieveUser(discordUser.id);
        var granter = this._retrieveUser(discordGranter.id);

        var award = new Award({
            _amount: amount,
            _source: source,
            _user: user,
            _granter: granter
        });

        this._setAward(award);

        return award;
    }

    penalizeUser(discordUser, discordGranter, amount, source) {
        var user = this._retrieveUser(discordUser.id);
        var granter = this._retrieveUser(discordGranter.id);

        var penalty = new Penalty({
            _amount: amount * -1,
            _source: source,
            _user: user,
            _granter: granter
        });

        this._setPenalty(penalty);

        return penalty;
    }
}