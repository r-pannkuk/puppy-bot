const { v4: uuidv4 } = require('uuid');

class PointChange {
    constructor({
        _id = null,
        _type = null,
        _granter = null,
        _user = null,
        _amount = 0,
        _source = null
    }) {
        this._id = _id || uuidv4();
        this._type = _type;
        this._granter = _granter;
        this._user = _user;
        this._amount = _amount;
        this._source = _source;
    }

    get id() { return this._id; }
    get type() { return this._type; }
    get granter() { return this._granter; }
    get user() { return this._user; }
    get amount() { return this._amount; }
    get source() { return this._source; }
}

PointChange.TYPE = {
    Penalty: 1,
    Award: 2,
    Bet: 3,
    Refund: 4
}

module.exports = PointChange;