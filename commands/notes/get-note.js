const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Notepad = require('../../core/notes/Notepad.js');
const Note = require('../../core/notes/Note.js');
const EmbedBuilder = require('../../core/notes/EmbedBuilder.js');


module.exports = class GetNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'get-note',
            group: 'notes',
            memberName: 'get-note',
            description: 'Retrieves a stored note.',
            aliases: ['getnote'],
            examples: ['!get-note myNoteKey'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'noteKey',
                    prompt: "Enter a note key to read the note stored for you.",
                    type: 'string'
                },
                {
                    key: 'user',
                    prompt: "Enter the user to search the note for.",
                    type: 'user',
                    error: 'Please enter a valid user.',
                    default: ''
                }
            ]
        });
    }


    /**
     * 
     * @param {Discord.Message} message 
     * @param {*} args 
     * @param {string} noteKey - Key for checking notes.
     * @param {Discord.User} user - The user targetted. 
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
            user = message.author;
        }

        if (user === '') {
            var notes = notepad.getNotesByKey(noteKey);
            if (notes.length === 0) {
                message.channel.send(`No notes found.`);
                return;
            }

            if (notes.length === 1) {
                message.channel.send(await EmbedBuilder.displayNote(resolvable, notes[0]));
            } else {
                var myNotes = notes.filter(n => n.authorId === message.author.id);

                if (myNotes.length === 1) {
                    message.channel.send(await EmbedBuilder.displayNote(resolvable, myNotes[0]));
                } else {
                    message.channel.send(await EmbedBuilder.displayKeys(resolvable, notes));
                }
            }

        } else {
            if (!notepad.hasNote(user, noteKey)) {
                message.channel.send(`No note found.`);
                return;
            }

            var note = notepad.getNote(user, noteKey);
            message.channel.send(await EmbedBuilder.displayNote(resolvable, note));
        }
    }
}