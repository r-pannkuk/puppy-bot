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
        var client = this.client;

        if(client.musicPlayer._isPlaying) {
            message.channel.send("Skipping track.");
            client.musicPlayer.skip();
        }
    }
}