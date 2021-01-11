const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Notepad = require('../../core/notes/Notepad.js');
const Note = require('../../core/notes/Note.js');
const EmbedBuilder = require('../../core/notes/EmbedBuilder.js');


module.exports = class DeleteNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'delete-note',
            group: 'notes',
            memberName: 'delete-note',
            description: 'Deletes the note stored at the given note key.',
            examples: ['!delete-note myNoteKey'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'noteKey',
                    prompt: "Enter a note key to read the note stored for you.",
                    type: 'string'
                },
                {
                    key: 'user',
                    prompt: "Enter the user to delete the key under.",
                    type: 'user',
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args 
     * @param {string} args.noteKey - The note key to delete.
     */
    async run(message, { noteKey, user }) {

        noteKey = noteKey.toLowerCase();
        if (message.guild) {
            /** @type {Notepad} */
            var notepad = message.guild.notepad;
            var resolvable = message.guild;
        } else {
            /** @type {Notepad} */
            var notepad = message.client.notepad;
            var resolvable = message.client;
        }

        var notes = notepad.getNotesByKey(noteKey);

        if (notes.length === 0) {
            message.channel.send(`No notes found with key \`${noteKey}\`.`);
            return;
        }

        if (user !== '') {
            notes = notes.filter(n => n.authorId === user.id);
        }

        if (notes.length === 0) {
            message.channel.send(`No notes found with key \`${noteKey}\`.`);
            return;
        } else if (notes.length > 1) {
            message.channel.send(`Found more than one note on file:\n`);
            message.channel.send(await EmbedBuilder.displayKeys(resolvable, notes));
        } else {
            var note = notes[0];

            if (!message.guild.members.cache.get(message.author.id).hasPermission('ADMINISTRATOR') &&
                note.authorId !== message.author.id) {
                message.channel.send(`You don't have permission to delete other people's notes.`);
                return;
            }

            notepad.deleteNote(note);
            message.channel.send(await EmbedBuilder.deleteNote(resolvable, notes[0]));
        }
    }
}