const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class StopCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'stop',
            group: 'music',
            memberName: 'stop',
            description: "Stops any currently playing music, and ends the queue.",
            examples: [
                '!stop'
            ]
        });
    }

    async run(message, { source }) {
        var client = this.client;

        client.musicPlayer.stop();
    }
}