const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/bet/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');
const NewWagerCommand = require('./newwager.js');

module.exports = class NewWagerNamedCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'newwager-named',
            group: 'bet',
            memberName: 'newwager-named',
            aliases: ['new-wager-named', 'nwn'],
            description: 'Creates a new named wager pool for players to bet on.',
            examples: ['!newwager-named "My Title" 500 @Dog#3471 @Hazelyn#6286'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [{
                    key: 'title',
                    prompt: "Enter a title for this wager pool.",
                    type: 'string',
                    default: ''
                },
                {
                    key: 'wager',
                    prompt: "Enter an optional reason for why this user is being penalized.",
                    type: 'integer',
                    min: 1
                },
                {
                    key: 'options',
                    prompt: "Enter the possible values to bet on for this wager.",
                    type: 'string',
                    infinite: true
                }

            ]
        });
    }

    async run(message, { title, wager, options }) {
        if (!message.guild.pointSystem.getUserAuthorization(message.guild.members.get(message.author.id))) {
            message.channel.send(`You don't have permission to use that command.`)
            return;
        }

        NewWagerCommand.createWager({
            message: message,
            title: title,
            wager: wager,
            options: options
        });
    }
}