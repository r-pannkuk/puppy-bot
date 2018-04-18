const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class PauseCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'pause',
            group: 'music',
            memberName: 'pause',
            description: "Pauses any currently playing music.  Resume to continue.",
            examples: [
                '!pause'
            ]
        });
    }

    async run(message, { source }) {
        var client = this.client;

        if(client.musicPlayer._isPlaying) {
            message.channel.send("Pausing music playback. Use !resume to continue.");
    
            client.musicPlayer.pause();
        } else {
            message.channel.send("No music is currently playing.");
        }

    }
}