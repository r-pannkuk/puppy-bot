const commando = require('discord.js-commando');
const Discord = require('discord.js');

const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js')

module.exports = class StatusCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'status',
            group: 'pelt',
            memberName: 'status',
            description: 'Player stats for battle.',
            examples: [ '!status', '!status @Dog' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a username to check their status.",
                    type: 'user',
                    default: {}
                }
            ]
        });
    }

    
    async run(message, { user }) {
        /* Checking if user was passed or if sent as default parameter. */

        if(Object.keys(user).length === 0) {
            user = message.author;
        }

        const stats = message.guild.battleSystem.retrieve(user.id);

        var embed = RichEmbedBuilder.status(user, stats);

        message.embed(embed);
    }
};