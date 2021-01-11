const uuid = require('uuid/v1');
const Discord = require('discord.js');
const commando = require('discord.js-commando');

/** 
 * @typedef {Object} NoteResolvable
 * @property {string} _id
 * @property {string} _authorId
 * @property {string} _guild
 * @property {string} _key
 * @property {string} _full
 * @property {Date} _createdAt
 * @property {Date} _modifiedAt
 */

class Note {
    /**
     * @param {NoteResolvable} param0
     */
    constructor({
        _id = uuid(),
        _authorId = null,
        _guild = null,
        _key = null,
        _full = null,
        _createdAt = new Date().toString(),
        _modifiedAt = new Date().toString(),
    }) {
        /** @private @type {string} */
        this._id = _id;
        /** @private @type {string} */
        this._authorId = _authorId;
        /** @private @type {string} */
        this._guild = _guild;
        /** @private @type {string} */
        this._key = _key;
        /** @private @type {string} */
        this._full = _full;
        /** @private @type {Date} */
        this._createdAt = _createdAt;
        /** @private @type {Date} */
        this._modifiedAt = _modifiedAt;
    }

    /** Unique note ID. */
    get id() { return this._id; }
    /** Author ID used for author resolvable object. */
    get authorId() { return this._authorId; }
    /** Returns the guild ID used in creating this note. */
    get guild() { return this._guild; }
    /** Returns the key used for note fetching. */
    get key() { return this._key; }
    /** Returns the full note set within the specified key. */
    get fullNote() { return this._full; }
    /** Returns the creation date for this note. */
    get createdAt() { return this._createdAt; }
    /** Returns the last time this message was modified. */
    get modifiedAt() { return this._modifiedAt; }

    /** Author object fetched from contextual guild or client.
     * @param {commando.CommandoClient|commando.CommandoGuild} userResolvable - 
     * Resolves the provided user ID to a user or member, depending on context.
     * @returns {Discord.User}
     */
    getAuthor(userResolvable) {
        if(userResolvable instanceof commando.CommandoClient) {
            return userResolvable.users.cache.get(this._authorId);
        } else if (userResolvable instanceof commando.CommandoGuild) {
            return userResolvable.members.cache.get(this._authorId);
        }
        throw new Error('Invalid User resolvable object. Please pass a valid guild or client.')
    }
}

module.exports = Note;