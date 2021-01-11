const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Notepad = require('../../core/notes/Notepad.js');
const Note = require('../../core/notes/Note.js');
const EmbedBuilder = require('../../core/notes/EmbedBuilder.js');


module.exports = class AllNotesCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'all-notes',
            group: 'notes',
            memberName: 'all-notes',
            description: 'Returns a list of keys to all notes you own.',
            aliases: ['allnotes', 'get-all-notes', 'getallnotes', 'get-notes', 'getnotes'],
            examples: [ '!all-notes' ],
            args: [
                {
                    key: 'user',
                    prompt: "Enter the user to search notes for.",
                    type: 'user',
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message - The message for the command.
     * @param {object} args 
     * @param {Discord.User} args.user - The User targetted. 
     */
    async run(message, { user }) {
        
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

        if(user !== '') {
            var notes = notepad.getAllNotesByUserAndGuild(user, message.guild);
        } else {
            var notes = notepad.getAllNotesByGuild(message.guild);
        }

        if(notes.length === 0) {
            var errorMsg = `No notes found`;

            if(user !== '') {
                errorMsg += ` for ${user}`;
            }

            errorMsg += `.`;

            message.channel.send(errorMsg);
            return;
        }

        notes.sort((a, b) => a.key < b.key);

        const EMBED_SIZE = 30;

        for(var i = 0; i < notes.length; i += EMBED_SIZE) {
            var notesSlice = notes.slice(i, i + EMBED_SIZE);
            message.channel.send(await EmbedBuilder.displayKeys(resolvable, notesSlice));
        }
    }
}