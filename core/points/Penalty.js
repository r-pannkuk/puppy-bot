const PointChange = require('./PointChange.js');
const assert = require('assert');

module.exports = class Penalty extends PointChange {
    constructor({
        _id = null,
        _granter = null,
        _user = null,
        _amount = 0,
        _source = null
    }) {
        super({
            _id,
            _granter,
            _user,
            _amount,
            _source,
            _type: PointChange.TYPE.Penalty
        })

        assert(_amount < 0, "Penalties must have a negative amount.");
    }
}