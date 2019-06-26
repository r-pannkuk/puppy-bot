const challonge = require('challonge');

module.exports = class Tournament {
    constructor({
        _id = null,
        _name = null,
        _startTime = new Date(),
        _endTime = undefined,
        _matches = [],
        _participants = [],
        _status = Tournament.STATE.Pending,
        _challongeObj = {
            name: null,
            url: null,
            tournamentType: 'single elimination',
            subdomain: null,
            description: null,
            openSignup: true,
            holdThirdPlaceMatch: true,
            ptsForMatchWin: 1.0,
            ptsForMatchTie: 0.5,
            ptsForGameWin: 0.0,
            ptsForGameTie: 0.0,
            ptsForBye: 1.0,
            swissRounds: 1,
            rankedBy: 'match wins',
            rrPtsForMatchWin: 1.0,
            rrPtsForMatchTie: 0.5,
            rrPtsForGameWin: 0.0,
            rrPtsForGameTie: 0.0,
            acceptAttachments: false,
            hideForum: false,
            showRounds: false,
            private: false,
            notifyUsersWhenMatchOpens: false,
            notifyUsersWhenTournamentEnds: false,
            sequentialPairings: false,
            signupCap: null,
            startAt: null,
            checkInDuration: null,
            grandFinalsModifier: null

        }
    }) {
        this._id = _id;
        this._name = _name;
        this._startTime = _startTime;
        this._endTime = _endTime;
        this._matches = _matches;
        this._participants = _participants;
        this._status = _status;
        this._challongeObj = _challongeObj;
    }

    static get STATE() {
        return {
            Pending: 1,
            Open: 2,
            Complete: 3
        }
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