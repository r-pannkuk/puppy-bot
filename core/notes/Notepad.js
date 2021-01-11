const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Enmap = require('enmap');
const Note = require('./Note.js');

/**
 * @typedef {Object<string, Note>} NoteStore
 */


module.exports = class Notepad {
    constructor(settingsResolvable) {
        if (settingsResolvable instanceof commando.CommandoClient ||
            settingsResolvable instanceof Discord.Client) {
                this._settingsResolvable = settingsResolvable.provider;
            if (this._settingsResolvable.get('global', 'notes') === undefined) {
                console.log("Global notepad settings not found, creating.");
                this._settingsResolvable.set('global', 'notes', {});
            }
        } else {
            this._guildId = settingsResolvable.guild.id;
            this._settingsResolvable = settingsResolvable;
            if (this._settingsResolvable.get('notes') === undefined) {
                console.log(`Notepad settings not found, creating for guild ${this._guildId}.`);
                this._settingsResolvable.set('notes', {});
            }
        }
    }

    /**
     * Notes listed under this notepad.
     *  @type {NoteStore} */
    get notes() {
        if (this._guildId) {
            return this._settingsResolvable.get('notes');
        } else {
            return this._settingsResolvable.get('global', 'notes');
        }
    }
    set notes(notes) {
        if (this._guildId) {
            this._settingsResolvable.set('notes', notes);
        } else {
            return this._settingsResolvable.set('global', 'notes', notes);
        }
    }

    /**
     * Serializes a note with the latest information associated to it.
     * @param {Note.NoteResolvable} note - Note ID or Note resolvable object.
     */
    _serializeNote(note) {
        var temp = this.notes;
        /** @type {Note.NoteResolvable} */
        var foundNote = {};
        if (note._id in Object.keys(temp)) {
            foundNote = temp[note._id];
        } else {
            foundNote = Object.values(temp).find(
                n => n._key === note._key && n._authorId === note._authorId
            ) || {};
        }

        var note = {
            _id: note._id || foundNote._id,
            _authorId: note._authorId || foundNote._authorId,
            _guild: note._guild || foundNote._guild,
            _key: note._key || foundNote._key,
            _full: note._full || foundNote._full,
            _createdAt: note._createdAt || foundNote._createdAt,
            _modifiedAt: note._modifiedAt || foundNote._modifiedAt
        }

        var newNote = new Note(note);

        temp[newNote.id] = newNote;
        this.notes = temp;

        return newNote;
    }

    /**
     * Sets a note for a user.
     * @param {User|Discord.User|Discord.GuildMember|string} user - The user to set the note under.
     * @param {Discord.Guild|commando.CommandoGuild|string} guild - The guild where the note was referenced.
     * @param {string} key - 
     * @param {string} note 
     */
    setNote(user, guild, key, note) {
        /** @typedef {Note.NoteResolvable} */
        var noteObj = {
            _authorId: user.id || user,
            _guild: guild.id || guild,
            _key: key,
            _full: note,
            _modifiedAt: Date.now()
        };

        var serializedNote = this._serializeNote(noteObj);

        return serializedNote;
    }

    /**
     * 
     * @param {User|Discord.User|Discord.GuildMember|string} user - The user to set the note under.
     * @param {string} key - The key to search for.
     */
    hasNote(user, key) {
        if ('id' in user) {
            user = user.id;
        }
        var foundNote = Object.values(this.notes).find(
            n => n._key === key && n._authorId === user
        );

        if (foundNote) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Obtains a note from the given key and user.
     * @param {User|Discord.User|Discord.GuildMember|string} user - The user to set the note under.
     * @param {string} key - The key to search for.
     */
    getNote(user, key) {
        if (!this.hasNote(user, key)) {
            throw new Error("Note not found under user.");
        }

        /** @typedef {Note.NoteResolvable} */
        var noteObj = {
            _authorId: user.id || user,
            _key: key
        };

        var note = this._serializeNote(noteObj);

        return note;
    }

    /**
     * Obtains all notes under a key.
     * @param {string} key - The key to search for.
     */
    getNotesByKey(key) {

        return Object.values(this.notes).map(n => new Note(n)).filter(n => n.key === key);
    }

    /**
     * Deletes a note permanently.
     * @param {Note} note - The note to delete.
     */
    deleteNote(note) {
        var temp = this.notes;
        delete temp[note.id];
        this.notes = temp;
    }

    /**
     * Deletes a note under a user with the specific key.
     * @param {User|Discord.User|Discord.GuildMember|string} user - The user to delete the note under.
     * @param {string} key - The key to search for.
     */
    deleteNoteByKey(user, key) {
        if (!this.hasNote(user, key)) {
            throw new Error("Note note found under user.");
        }

        if (user.id) {
            user = user.id;
        }

        var note = Object.values(temp).find(
            n => n._key === key && n._authorId === user
        );

        this.deleteNote(note);

        return note;
    }

    /**
     * Obtains all keys for the given guild.
     * @param {Discord.Guild|commando.CommandoGuild|string} guild 
     */
    getAllNotesByGuild(guild) {
        if (guild.id) {
            guild = guild.id;
        }

        return Object.values(this.notes).map(n => new Note(n)).filter(n => n.guild === guild);
    }

    /**
     * Obtains all keys for the given user and optionally guild.
     * @param {User|Discord.User|Discord.GuildMember|string} user - The user to get the notes for.
     * @param {Discord.Guild|commando.CommandoGuild|string} guild - (Optional) The guild to filter the user's notes under.
     */
    getAllNotesByUserAndGuild(user, guild) {
        if (user.id) {
            user = user.id;
        }
        if (guild && guild.id) {
            guild = guild.id;
        }

        return Object.values(this.notes).map(n => new Note(n)).filter(
            n => n.authorId === user &&
                ((guild !== undefined) ? (n.guild === guild) : true)
        );
    }
}