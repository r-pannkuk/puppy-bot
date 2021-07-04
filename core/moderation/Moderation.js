import { v4 as uuidv4 } from 'uuid';

/** A Moderation for a user, stripping them of the roles specified for the duration between _startTime and _endTime. */
class Moderation {
    /**
     * Create a new Moderation.
     * 
     * @param {Object} params - Constructor parameters 
     * @param {string} params._id - UUID for this moderation object.
     * @param {string} params._userId - Discord ID for this user.
     * @param {string[]} params._roles - A list of roles this user has at the time of moderation.
     * @param {Date} params._startTime - When this Moderation was started.
     * @param {Date} params._lastEditedTime - The last time this moderation was edited.
     * @param {Date} params._endTime - When this Moderation is set to end.
     * @param {boolean} params._active - If the Moderation is currently enabled.
     */
    constructor({
        _id = uuidv4(),
        _userId = null,
        _moderatorId = null,
        _roles = [],
        _startTime = Date.now(),
        _lastEditedTime = Date.now(),
        _endTime = new Date('Dec 31 23:59:59 2099 UTC').toString(),
        _active = true
    }) {
        this._id = _id;
        this._userId = _userId;
        this._moderatorId = _moderatorId;
        this._roles = _roles;
        this._startTime = _startTime;
        this._lastEditedTime = _lastEditedTime;
        this._endTime = _endTime;
        this._active = _active;
    }
}

module.exports = Moderation;