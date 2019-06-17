const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');


module.exports = class AwardCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'award',
            group: 'points',
            memberName: 'award',
            description: 'Awards a player currency with a specified reason.',
            examples: ['!award @Dog#3471 100', '!award @Dog#3471 100 Being a huge nerd'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: "Please provide the user to award.",
                    type: 'user'
                },
                {
                    key: 'amount',
                    prompt: "Enter the amount to award the player with.",
                    type: 'integer'
                },
                {
                    key: 'reason',
                    prompt: "Enter an optional reason for why this user is being awarded.",
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

        var award = message.guild.pointSystem.awardUser(
            user,
            message.author,
            amount,
            source
        );

        if (award !== undefined) {
            if (reason !== '') {
                message.channel.send(`${user} was awarded ${amount} by ${message.author} for: ${reason}`);
            } else {
                message.channel.send(`${user} was awarded ${amount} by ${message.author}.`);
            }
        } else {
            message.channel.send(`Something went wrong.  No award given.`);
        }
    }
}