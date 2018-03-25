const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-note',
            group: 'notes',
            memberName: 'set-note',
            description: 'Creates or updates a note using the given key.',
            examples: [ '!get-note myNoteKey' ],
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

    
    async run(message, { noteKey, note }) {
        this.client.notepad.setNote(message.author.id, noteKey, note);

        message.channel.send(`${noteKey} created succesfully.`);
    }
}