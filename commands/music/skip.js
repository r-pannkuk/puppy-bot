const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class SkipCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'skip',
            group: 'music',
            memberName: 'skip',
            description: "Skip the current track in the music queue.",
            examples: [
                '!skip'
            ]
        });
    }

    async run(message, { source }) {
        var guild = message.guild;

        if(guild.musicPlayer.isPlaying()) {
            message.channel.send("Skipping track.");
            guild.musicPlayer.skip();
        }
    }
}