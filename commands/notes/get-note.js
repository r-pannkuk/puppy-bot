const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class GetNoteCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'get-note',
            group: 'notes',
            memberName: 'get-note',
            description: 'Retrieves a stored note.',
            examples: [ '!get-note myNoteKey' ],
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
        var note = message.guild.notepad.getNote(message.author.id, noteKey);
        if(note === undefined) {
            message.send()
        }

        var embed = new Discord.MessageEmbed()
            .setColor('YELLOW');

        embed.setAuthor(noteKey, 'https://lh4.ggpht.com/er4T35JxjGnIFYL_p7HU9G0GFwNJ2eZzt1oGloPL9RC18f_MUU4h5_wwHI6IGGKWIuw=w300');
        embed.setDescription(`${note.description}`);
        embed.setFooter(`${message.author.username} | ${note.timestamp.toString()}`, message.author.avatarUrl);
            
        message.channel.send(embed);
    }
}