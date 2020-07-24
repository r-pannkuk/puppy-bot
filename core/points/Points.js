const Discord = require('discord.js');

const User = require('./User.js');
const Penalty = require('./Penalty.js');
const Award = require('./Award.js');
const BetPool = require('../bet/BetPool.js');
const PointChange = require('./PointChange.js');
const Account = require('./Account.js');

module.exports = class Points {
    constructor(guildSettings) {
        if (guildSettings.get('points') === undefined) {
            console.log("Point settings not found, creating.");
            guildSettings.set('points', {
                users: {},
                awards: {},
                penalties: {},
                bets: {},
                betPools: {},
                adminRoles: []
            });
        }

        this.guildSettings = guildSettings;

        var settings = this.guildSettings.get('points');

        if (settings.users === undefined) {
            settings.users = {};
        }

        if (settings.awards === undefined) {
            settings.awards = {};
        }

        if (settings.penalties === undefined) {
            settings.penalties = {};
        }

        if (settings.betPools === undefined) {
            settings.betPools = {};
        }

        if (settings.adminRoles === undefined) {
            settings.adminRoles = [];
        }

        this.guildSettings.set('points', settings);
    }

    get settings() { return this.guildSettings.get('points'); }
    set settings(obj) { return this.guildSettings.set('points', obj); }

    get awards() { return this.settings.awards; }
    get users() { return this.settings.users; }
    get penalties() { return this.settings.penalties; }
    get betPools() { return this.settings.betPools; }
    get adminRoles() { return this.settings.adminRoles; }


    _serialize(system, generator, id) {
        var stored = generator(system[id] || { _id: id });
        system[id] = stored;
        return system[id];
    }

    _serializeUser(user_id) { return this._serialize(this.settings.users, (obj) => new User(obj), user_id); }
    _serializeAward(award_id) { return this._serialize(this.settings.awards, (obj) => new Award(obj), award_id); }
    _serializePenalty(penalty_id) { return this._serialize(this.settings.penalties, (obj) => new Penalty(obj), penalty_id); }
    _serializeBetPool(betPool_id) { return this._serialize(this.settings.betPools, (obj) => new BetPool(obj), betPool_id); }

    addAdminRole(role_id) {
        var settings = this.settings;

        settings.adminRoles.push(role_id);

        this.settings = settings;
    }

    getUser(discordUser) {
        return this._serializeUser(discordUser.id);
    }

    /**
     * Returns member's authorization to use points.
     * @param {Discord.GuildMember} member - Guild member
     */
    getUserAuthorization(member) {
        var hasAuthorization = false;

        for (var i in this.adminRoles) {
            hasAuthorization = member.roles.has(this.adminRoles[i]) || hasAuthorization;

            if (hasAuthorization) {
                return true;
            }
        }

        return false;
    }

    setUser(userObj) {
        var settings = this.settings;
        settings.users[userObj.id] = userObj;
        this.settings = settings;
    }

    getUserByAccount(account) {
        var user = Object.values(this.settings.users).find(u => {
            var accounts = u._accounts;

            if (accounts.some(a => {
                if (a._service === account._service &&
                    a._username.toLowerCase() === account._username.toLowerCase()
                ) {
                    return true;
                }
                return false;
            })) {
                return true;
            }


            return false;
        });

        return user;
    }

    getUserAccount(discordUser, serviceType) {
        var user = this._serializeUser(discordUser.id);
        var foundAccount = user._accounts.find(a => a._service === serviceType);
        if(!foundAccount) return;

        return new Account(foundAccount);
    }

    getAllUserAccounts() {
        var users = {};

        Object.values(this.users).forEach(u => users[u._id] = u._accounts.map(a => new Account(a)));

        return users;
    }

    findAccountByMessage(message_id) {
        var accounts = [].concat.apply([], Object.values(this.settings.users).map(u => u._accounts));
        return accounts.find(a => a._confirmationMessageId === message_id);
    }

    setUserAccount(discordUser, account) {
        var settings = this.settings;
        var user = this.removeUserAccount(discordUser, account._service);

        user._accounts.push(account);

        settings.users[user.id] = user;
        this.settings = settings;

        return user;
    }

    removeUserAccount(discordUser, serviceType) {
        var settings = this.settings;
        var user = this._serializeUser(discordUser.id);
        var account = this.getUserAccount(discordUser, serviceType);

        if (!account) return user;

        user._accounts.splice(user._accounts.findIndex(a => {
            return a._service === account._service
        }), 1);

        settings.users[user.id] = user;
        this.settings = settings;

        return user;
    }

    _changeUserPoints(pointChange) {
        var settings = this.settings;
        var user = this._serializeUser(pointChange._user);

        user._changes.push(pointChange._id);
        user._currentBalance += pointChange._amount;

        if (pointChange._amount > 0 && pointChange._type !== PointChange.TYPE.Refund) {
            user._lifetimeBalance += pointChange._amount;
        }

        settings.users[pointChange._user] = user;

        if (pointChange._user === pointChange._granter) {
            var granter = user;
        }
        else if (pointChange._granter) {
            var granter = this._serializeUser(pointChange._granter);
        }

        if (granter) {
            granter._grants.push(pointChange._id);
            settings.users[pointChange._granter] = granter;
        }

        this.settings = settings;
    }

    awardUser(discordUser, discordGranter, amount, source) {

        var award = new Award({
            _amount: amount,
            _source: source,
            _user: discordUser.id,
            _granter: discordGranter.id
        });

        this._changeUserPoints(award);

        var settings = this.settings;
        settings.awards[award._id] = award;
        this.settings = settings;

        return award;
    }

    penalizeUser(discordUser, discordGranter, amount, source) {

        var penalty = new Penalty({
            _amount: -1 * amount,
            _source: source,
            _user: discordUser.id,
            _granter: discordGranter.id
        });

        this._changeUserPoints(penalty);

        var settings = this.settings;
        settings.awards[penalty._id] = penalty;
        this.settings = settings;

        return penalty;
    }

    newBetPool(discordUser, betSize, source, options, title = null) {
        var settings = this.settings;

        var user = this._serializeUser(discordUser.id);

        var betPool = new BetPool({
            _owner: user,
            _source: source,
            _options: options,
            _betSize: betSize,
            _name: title
        });

        settings.users[user.id] = user;
        settings.betPools[betPool._id] = betPool;

        this.settings = settings;

        return betPool;
    }

    findBetPoolByMessage(message_id) {
        var betPool = Object.values(this.settings.betPools).find(bp => bp._message._id === message_id);

        if (betPool) {
            return this._serializeBetPool(betPool._id);
        }
    }

    findAllBetPools(predicate) {
        var filtered = Object.values(this.settings.betPools)
        .map(bp => new BetPool(bp))
        .filter(bp => predicate(bp));

        return filtered;
    }

    _updateBetPool(betPool) {
        var settings = this.settings;
        settings.betPools[betPool._id] = betPool;
        this.settings = settings;
    }

    subscribeBetPool(betPool, message) {
        var betPool = this._serializeBetPool(betPool._id);
        betPool._message._id = message.id;
        this._updateBetPool(betPool);
        return betPool;
    }

    openBetPool(betPool, modifier) {
        var betPool = this._serializeBetPool(betPool._id);
        var modifier = this._serializeUser(modifier._id);
        betPool.open(modifier);
        this._updateBetPool(betPool);
        return betPool;
    }

    closeBetPool(betPool, modifier) {
        var betPool = this._serializeBetPool(betPool._id);
        var modifier = this._serializeUser(modifier._id);
        betPool.close(modifier);
        this._updateBetPool(betPool);
        return betPool;
    }

    completeBetPool(betPool, modifier, condition) {
        var betPool = this._serializeBetPool(betPool._id);
        var modifier = this._serializeUser(modifier._id);
        betPool.complete(modifier, condition);
        this._updateBetPool(betPool);
        return betPool;
    }

    awardBetPool(betPool) {
        var betPool = this._serializeBetPool(betPool._id);
        var awards = betPool.awardAll().filter(a => a);
        this._updateBetPool(betPool);

        if (awards.length > 0) {
            awards.forEach((b) => this._changeUserPoints(b));
            var settings = this.settings;
            awards.forEach(a => settings[a._id] = a);
            this.settings = settings;
        }

        return betPool;
    }

    refundBetPool(betPool) {
        var betPool = this._serializeBetPool(betPool._id);
        var refunds = betPool.refundAll();
        this._updateBetPool(betPool);

        if (refunds.length > 0) {
            refunds.forEach((b) => this._changeUserPoints(b));
            var settings = this.settings;
            refunds.forEach(r => settings.awards[r._id] = r);
            this.settings = settings;
        }

        return betPool;
    }

    newBet(discordUser, betPool, source, outcome) {
        var settings = this.settings;

        var user = this._serializeUser(discordUser.id);
        var betPool = this._serializeBetPool(betPool._id);

        var amount = betPool._betSize;

        if (amount >= user._currentBalance) {
            amount = user._currentBalance;
        }

        var bet = betPool.addBet({
            _user: user._id,
            _source: source,
            _outcome: outcome,
            _wager: amount
        });

        this._changeUserPoints(bet);
        user = this._serializeUser(discordUser.id);

        user._bets[betPool._id] = bet._id;

        settings.users[user._id] = user;
        settings.betPools[betPool._id] = betPool;

        this.settings = settings;

        return bet;
    }

    refundBet(discordUser, betPool) {
        var settings = this.settings;

        var user = this._serializeUser(discordUser.id);
        var betPool = this._serializeBetPool(betPool._id);

        var refund = betPool.refund(user);

        if (!refund) {
            return null;
        }

        this._changeUserPoints(refund);

        user = this._serializeUser(discordUser.id);

        delete user._bets[betPool._id];

        settings.users[user._id] = user;
        settings.betPools[betPool._id] = betPool;

        this.settings = settings;

        return betPool;
    }
}