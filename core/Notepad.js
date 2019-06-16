// const Enmap = require('enmap');

// module.exports = class Notepad {
//     constructor(guildSettings) {
//         this.guildSettings = guildSettings;

//         this.guildSettings.get('notes', {});
//     }

//     get notes() { return this.guildSettings.get('notes'); }
//     set notes(notes) { this.guildSettings.set('notes', notes); }

//     setNote(user, key, note) {
//         if(!(user.id in this.notes)) {
//             this.notes[user.id] = {};
//         }

//         this.notes[user.id][key] = {
//             description: note,
//             timestamp: new Date()
//         };

//         this.notes = notes;
//     }

//     getNote(user, key) {
//         if(!(user.id in this.notes)) {
//             return undefined;
//         }

//         if(!(key in this.notes[user.id])) {
//             return undefined;
//         }

//         return this.notes[user.id][key];
//     }

//     deleteNote(user, key) {
//         var notes = this.guildSettings.get('notes');

//         if(!(user.id in notes)) {
//             return undefined;
//         }

//         if(!(key in notes[user.id])) {
//             return undefined;
//         }

//         var note = notes[user.id][key];

//         delete notes[user.id][key];

//         this.guildSettings.set('notes', notes);

//         return note;
//     }

//     getKeys(user) {
//         var sortedKeys = Object.keys(this.notes).sort((a, b) => a.timestamp - b.timestamp);

//         return sortedKeys;
//     }
// }