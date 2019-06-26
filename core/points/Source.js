module.exports = class Source {
    constructor({
        _type = null,
        _id = null
    }) {
        this._type = _type;
        this._id = _id;
    }

    static get TYPE() {
        return {
            Custom: 1,
            Command: 2,
            Bet: 3,
            Match: 4,
            Reaction: 5,
            Tournament: 6
        }
    }
}