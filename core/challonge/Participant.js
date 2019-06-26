module.exports = class Participant {
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