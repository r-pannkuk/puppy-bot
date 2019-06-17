const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');


module.exports = class PenaltyCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'penalty',
            group: 'points',
            memberName: 'penalty',
            alias: 'subtract',
            description: 'Subtracts a user\'s balance with an optional reason.',
            examples: ['!penalty @Dog#3471 100', '!penalty @Dog#3471 100 Being a huge nerd'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: "Please provide the user to penalize.",
                    type: 'user'
                },
                {
                    key: 'amount',
                    prompt: "Enter the amount to subtract from the player.",
                    type: 'integer'
                },
                {
                    key: 'reason',
                    prompt: "Enter an optional reason for why this user is being penalized.",
                    type: 'string',
                    infinte: true,
                    default: ''
                }
            ]
        });
    }

    async run(message, { user, amount, reason }) {
        var source = new Source({
            _type: Source.TYPE.Command,
            _id: message._id
        });

        var award = message.guild.pointSystem.penalizeUser(
            user,
            message.author,
            amount,
            source
        );
        if (award !== undefined) {
            if (reason !== '') {
                message.channel.send(`${user} was penalized ${amount} by ${message.author} for: ${reason}`);
            } else {
                message.channel.send(`${user} was penalized ${amount} by ${message.author}.`);
            }
        } else {
            message.channel.send(`Something went wrong.  No penalty given.`);
        }
    }
}