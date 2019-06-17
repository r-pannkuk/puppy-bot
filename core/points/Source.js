class Source {
    constructor({
        _type = null,
        _id = null
    }) {
        this._type = _type;
        this._id = _id;
    }
}

Source.TYPE = {
    Custom: 1,
    Command: 2,
    Bet: 3,
    Match: 4
}

module.exports = Source;