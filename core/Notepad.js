const Enmap = require('enmap');
const EnmapSQLite = require('enmap-sqlite');

module.exports = class Notepad {
    constructor(settings) {
        this._enmap = new Enmap({
            provider: new EnmapSQLite({
                name: settings.name
            })
        });

        this.retrieve = function(user) {
            var notes = this._enmap.get(user);

            if(notes === undefined) {
                notes = {};
                this._enmap.set(user, notes);
            }

            return notes;
        }
    }

    setNote(user, key, note) {
        var notes = this.retrieve(user);

        notes[key] = {
            description: note,
            timestamp: new Date()
        };

        this._enmap.set(user, notes);
    }

    getNote(user, key) {
        var notes = this.retrieve(user);

        if(key in notes) {
            return notes[key];
        }

        return undefined;
    }

    deleteNote(user, key) {
        var notes = this.retrieve(user);

        if(key in notes) {
            delete notes[key];
        }

        this._enmap.set(user, notes);
    }

    getKeys(user) {
        var notes = this.retrieve(user);

        var sortedKeys = Object.keys(notes).sort((a, b) => a.timestamp - b.timestamp);

        return sortedKeys;
    }
}