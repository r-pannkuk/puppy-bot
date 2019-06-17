const challonge = require('challonge');

class Tournament {
    constructor({
        _id = null,
        _challongeID = null,
        _name = null,
        _startTime = new Date(),
        _endTime = undefined,
        _matches = [],
        _participants = [],
        _status = Tournament.STATE.PENDING
    }) {
        this._id = _id;
        this._challongeID = _challongeID;
        this._name = _name;
        this._startTime = _startTime;
        this._endTime = _endTime;
        this._matches = _matches;
        this._participants = _participants;
        this._status = _status;
    }

    get id() { return this._id; }
    get challongeID() { return this._challongeID; }
    get name() { return this._name; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }
    get matches() { return this._matches; }
    get participants() { return this._participants; }
    get status() { return this._status; }
}

Tournament.STATE = {
    PENDING: 1,
    OPEN: 2,
    COMPLETE: 3
}

class Match {
    constructor({
        _id = null,
        _challongeID = null,
        _tournamentID = null,
        _participants = [],
        _startTime = new Date(),
        _endTime = undefined,
        _status = Match.STATE.PENDING
    }) {
        this._id = _id || null;
        this._challongeID = _challongeID;
        this._tournamentID = _tournamentID;
        this._participants = _participants;
        this._startTime = _startTime;
        this._endTime = _endTime;
        this._status = _status;
    }

    get id() { return this._id; }
    get challongeID() { return this._challongeID; }
    get tournamentID() { return this._tournamentID; }
    get participants() { return this._participants; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }
    get status() { return this._status; }
}

Match.STATE = {
    Pending: 1,
    Open: 2,
    Complete: 3
}

class Participant {
    constructor({
        _id = null,
        _challongeID = null,
        _tournamentID = null,
        _matches = [],
        _rank = -1
    }) {
        this._id = _id;
        this._challongeID = _challongeID;
        this._tournamentID = _tournamentID;
        this._matches = _matches;
        this._rank = _rank;
    }

    get id() { return this._id; }
    get challongeID() { return this._challongeID; }
    get tournamentID() { return this._tournamentID; }
    get matches() { return this._matches; }
}

module.exports = class Challonge {
    constructor(guildSettings, config) {
        if (guildSettings.get('challonge') === undefined) {
            console.log("Challonge settings not found, creating.");
            guildSettings.set('challonge', {});
        }

        this.guildSettings = guildSettings;
        this._apiKey = config.apiKey;
        this._client = challonge.createClient({
            apiKey: this._apiKey
        });
    }

    get settings() { return this.guildSettings.get('challonge'); }
    set settings(settings) { this.guildSettings.set('challonge', settings); }

    getTournaments(callback) {
        this._client.tournaments.index({ callback: callback });
    }

    getTournament(tournamentID, callback) {
        var tournament = this._client.tournaments.show({
            id: tournamentID,
            callback: callback
        });
    }

    createTournament({
        name,
        tournament_type,
        url,
        subdomain,
        description,
        open_signup,
        hold_third_place_match,
        pts_for_match_win,
        pts_for_match_tie,
        pts_for_game_win,
        pts_for_game_tie,
        pts_for_bye,
        swiss_rounds,
        ranked_by,
        rr_pts_for_match_win,
        rr_pts_for_match_tie,
        rr_pts_for_game_win,
        rr_pts_for_game_tie,
        accept_attachments,
        hide_forum,
        show_rounds,
        // private,
        notify_users_when_match_opens,
        notify_users_when_tournament_ends,
        sequential_pairings,
        signup_cap,
        start_at,
        check_in_duration,
        grand_finals_modifier
    }, callback) {
        var obj = arguments[0];

        this._client.tournaments.create({
            obj,
            callback: callback
        });
    }
}