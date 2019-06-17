const PointChange = require('./PointChange.js');
const assert = require('assert');

module.exports = class Award extends PointChange {
    constructor({
        _granter = null,
        _user = null,
        _amount = 0,
        _source = null
    }) {
        super({
            _granter,
            _user,
            _amount,
            _source,
            _type: PointChange.TYPE.Award
        })

        assert(_amount >= 0, "Awards must have a positive value.");
    }
}