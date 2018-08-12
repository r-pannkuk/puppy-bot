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
        var guild = message.guild;

        if(guild.musicPlayer.isPlaying()) {
            message.channel.send("Pausing music playback. Use !resume to continue.");
    
            guild.musicPlayer.pause();
        } else {
            guild.channel.send("No music is currently playing.");
        }

    }
}