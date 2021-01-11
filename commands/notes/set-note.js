const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Notepad = require('../../core/notes/Notepad.js');
const Note = require('../../core/notes/Note.js');
const EmbedBuilder = require('../../core/notes/EmbedBuilder.js');

module.exports = class SetNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-note',
            group: 'notes',
            memberName: 'set-note',
            description: 'Creates or updates a note using the given key.',
            aliases: ['note', 'setnote'],
            examples: [ '!set-note noteKey "This is a note."' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'noteKey',
                    prompt: "Enter a note key to store the note in.",
                    type: 'string'
                },
                {
                    key: 'note',
                    prompt: "The description or text you want to store.",
                    type: 'string'
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args 
     * @param {string} args.noteKey - The key for the note to set.
     * @param {string} args.note - The note to set for the user.
     */
    async run(message, { noteKey, note }) {
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

        var returnedNote = notepad.setNote(message.author, message.guild, noteKey, note);

        message.channel.send(await EmbedBuilder.setNote(resolvable, returnedNote));
    }
}