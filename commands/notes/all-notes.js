const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class AllNotesCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'all-notes',
            group: 'notes',
            memberName: 'all-notes',
            description: 'Returns a list of keys to all notes you own.',
            examples: [ '!all-notes' ]
        });
    }

    
    async run(message) {
        var keys = this.client.notepad.getKeys(message.author.id);
        if(keys.length === 0) {
            message.channel.send("No keys found. Please enter a note first.");
            return;
        }

        var keyString = keys.reduce((string, key) => string = string + '\n' + key.toString(), "");

        var embed = new Discord.RichEmbed()
            .setColor('YELLOW');

        embed.setAuthor(`Note Keys`, 'https://lh4.ggpht.com/er4T35JxjGnIFYL_p7HU9G0GFwNJ2eZzt1oGloPL9RC18f_MUU4h5_wwHI6IGGKWIuw=w300');
        embed.setDescription(keyString);
        embed.setFooter(message.author.username, message.author.avatarUrl);
            
        message.channel.send(embed);
    }
}