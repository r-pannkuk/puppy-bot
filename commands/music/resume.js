const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class ResumeCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'resume',
            group: 'music',
            memberName: 'resume',
            description: "Resumes a paused track.",
            examples: [
                '!resume'
            ]
        });
    }

    async run(message, { source }) {
        var client = this.client;

        if(!client.musicPlayer._isPlaying && client.musicPlayer._queue.length > 0) {
            message.channel.send("Playback resumed.");

            client.musicPlayer.resume();
        } else {
            message.channel.send("No music is currently paused.");
        }
    }
}