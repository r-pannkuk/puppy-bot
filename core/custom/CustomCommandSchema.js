const Discord = require('discord.js');
const commando = require('discord.js-commando');

module.exports = class CustomCommandSchema {
    /**
     * 
     * @param {commando.CommandoClient} client 
     * @param {Object} args 
     * @param {string} args._name
     * @param {string} args._owner
     * @param {string} args._content
     * @param {number} args._creationDate
     * @param {number} args._lastUsedDate
     * @param {number} args._useCount
     */
    constructor({
        _name,
        _owner,
        _content,
        _creationDate = Date.now(),
        _lastUsedDate = Date.now(),
        _useCount = 0
    }) {
        /** @private @type {string} */
        this._name = _name;
        /** @private @type {string} */
        this._owner = _owner;
        /** @private @type {string} */
        this._content = _content;
        /** @private */
        this._creationDate = _creationDate;
        /** @private */
        this._lastUsedDate = _lastUsedDate;
        /** @private */
        this._useCount = _useCount;
    }

    /** The name of the command (for invocation). @type {string} */
    get name() { return this._name; }
    /** The ID of the owner of the command. @type {string} */
    get owner() { return this._owner; }
    /** The content of this command, sent when invoked. @type {string}*/
    get content() { return this._content; }
    /** The creation date for this command. @type {Date} */
    get creationDate() { return new Date(this._creationDate); }
    /** The last use date for this command. @type {Date} */
    get lastUsedDate() { return new Date(this._lastUsedDate); }
    /** @param {Date|number} d */
    set lastUsedDate(d) { 
        if(d instanceof Date) {
            this._lastUsedDate = d.getTime();
        } else if(typeof(d) === 'number') {
            this._lastUsedDate = d;
        } else {
            throw new Error(`Must be a number or Date value.`);
            return;
        }
    }
    /** The amount of uses this command has had. @type {number} */
    get useCount() { return this._useCount; }
    /** @param {number} u */
    set useCount(u) { this._useCount = u; }
}