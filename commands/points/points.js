const commando = require('discord.js-commando');
const Points = require('../../core/points/Points.js');


module.exports = class PointsCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'points',
            group: 'points',
            memberName: 'points',
            description: 'Check a player\'s current points count.',
            examples: ['!points @Dog#3471', '!points'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: "Please provide the user to award.",
                    type: 'user',
                    default: ''
                }
            ]
        });
    }

    async run(message, { user }) {
        if(user === '' || user === undefined) {
            user = message.author;
        }

        var userStats = message.guild.pointSystem.getUser(user);

        message.channel.send(`${user}: ${userStats.currentBalance} [Lifetime: ${userStats.lifetimeBalance}]`);
    }
}