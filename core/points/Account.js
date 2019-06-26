module.exports = class Account {
    constructor({
        _service = null,
        _username = "",
        _confirmationMessageId = null,
        _status = Account.STATUS.Pending
    }) {
        this._service = _service;
        this._username = _username;
        this._confirmationMessageId = _confirmationMessageId;
        this._status = _status;
    }

    static get SERVICE() {
        return {
            Challonge: 'challonge'
        }
    }

    static get STATUS() {
        return {
            Pending: 1,
            Approved: 2,
            Confirmed: 3
        }
    }
}