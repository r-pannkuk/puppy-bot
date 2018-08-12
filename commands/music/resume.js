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
        var guild = message.guild;

        if(!guild.musicPlayer.isPlaying() && guild.musicPlayer._queue.length > 0) {
            message.channel.send("Playback resumed.");

            guild.musicPlayer.resume();
        } else {
            message.channel.send("No music is currently paused.");
        }
    }
}