const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class PlayCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'play',
            group: 'music',
            memberName: 'play',
            description: "Plays music from the specified YouTube or SoundCloud link.",
            examples: [
                '!play https://www.youtube.com/watch?v=BOnp3G4h7cg'
            ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'source',
                    prompt: "Please enter a valid YouTube or Soundcloud link to play.",
                    type: 'string',
                    validate: input => {
                        // Validate Youtube and Soundcloud links here
                        return true;
                    }
                }
            ]
        });
    }

    async run(message, { source }) {
        var guild = message.guild;
        var messageChannel = message.channel;

        console.log("Play");

        guild.musicPlayer.enqueue(source, function(err, videoInfo) {
            messageChannel.send(`Added track: **${videoInfo.title}**`);

            if(!guild.musicPlayer.isPlaying()) {
                guild.musicPlayer.play(videoInfo, message.member.voiceChannel);
            }
        }, function(videoInfo) {
            messageChannel.send(`Now playing: **${videoInfo.title}**`);
        });
    }
}