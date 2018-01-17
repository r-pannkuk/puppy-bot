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
        var client = this.client;

        client.musicPlayer.enqueue(source, function(err, videoInfo) {
            client.musicPlayer.play(videoInfo, message);
        });
    }
}