const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class DeleteNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'delete-note',
            group: 'notes',
            memberName: 'delete-note',
            description: 'Deletes the note stored at the given note key.',
            examples: [ '!delete-note myNoteKey' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'noteKey',
                    prompt: "Enter a note key to read the note stored for you.",
                    type: 'string'
                }
            ]
        });
    }

    
    async run(message, { noteKey }) {
        message.guild.notepad.deleteNote(message.author.id, noteKey);

        message.channel.send(`${noteKey} deleted from your notes.`);
    }
}