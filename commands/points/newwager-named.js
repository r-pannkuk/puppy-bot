const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/points/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');
const NewWagerCommand = require('./newwager.js');

module.exports = class NewWagerNamedCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'newwager-named',
            group: 'points',
            memberName: 'newwager-named',
            aliases: ['new-wager-named', 'nwn'],
            description: 'Creates a new named wager pool for players to bet on.',
            examples: ['!newwager-named "My Title" 500 @Dog#3471 @Hazelyn#6286'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
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
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
            message.guild.pointSystem.adminRoles.find(r => message.guild.member(message.author).roles.has(r));

        if (!bool) {
            message.channel.send('You must have permissions to use this command.');
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