module.exports = class Match {
    constructor({
        _id = null,
        _challongeID = null,
        _tournamentID = null,
        _participants = [],
        _startTime = Date.now(),
        _endTime = undefined,
        _status = Match.STATE.Pending
    }) {
        this._id = _id || null;
        this._challongeID = _challongeID;
        this._tournamentID = _tournamentID;
        this._participants = _participants;
        this._startTime = _startTime;
        this._endTime = _endTime;
        this._status = _status;
    }

    get STATE() {
        return {
            Pending: 1,
            Open: 2,
            Complete: 3
        }
    }

    get id() { return this._id; }
    get challongeID() { return this._challongeID; }
    get tournamentID() { return this._tournamentID; }
    get participants() { return this._participants; }
    get startTime() { return this._startTime; }
    get endTime() { return this._endTime; }
    get status() { return this._status; }
}
