const PointChange = require('./PointChange.js');
const assert = require('assert');

module.exports = class Award extends PointChange {
    constructor({
        _id = null,
        _granter = null,
        _user = null,
        _amount = 0,
        _source = null,
        _type = PointChange.TYPE.Award
    }) {
        super({
            _id,
            _granter,
            _user,
            _amount,
            _source,
            _type
        })

        assert(_amount >= 0, "Awards must have a positive value.");
    }
}