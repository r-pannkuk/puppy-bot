const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const emojis = require('../../core/bet/Emojis.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');


const OPTIONS_LIMIT = 16;

module.exports = class NewWagerCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'newwager',
            group: 'bet',
            memberName: 'newwager',
            aliases: ['new-wager', 'nw'],
            description: 'Creates a new wager pool for players to bet on.',
            examples: ['!newwager 500 @Dog#3471 @Hazelyn#6286'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
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

    static createWager({
        message,
        title,
        wager,
        options
    }) {

        if(options.length > OPTIONS_LIMIT) {
            message.channel.send(`Please limit the number of unique options to ${OPTIONS_LIMIT} or less.`);
            return;
        }

        var source = new Source({
            _type: Source.TYPE.Command,
            _id: message._id
        });
    
        var discordifyOption = (val) => {
            const matches = val.match(/^<@!?(\d+)>$/);
            if (matches === null) return val;
    
            const id = matches[1];
            return message.guild.members.get(id).displayName;
        }
    
        var translatedOptions = options.map(discordifyOption);
    
        var betPool = message.guild.pointSystem.newBetPool(message.author, wager, source, translatedOptions, title);
    
        betPool = message.guild.pointSystem.openBetPool(betPool, message.author);
    
        var embed = RichEmbedBuilder.new(betPool);
    
        message.channel.send(embed).then(async (msg) => {
    
            message.guild.pointSystem.subscribeBetPool(betPool, msg);
    
            await RichEmbedBuilder.addReactions({
                message: msg, 
                betPool: betPool
            });
        });
    }

    async run(message, { wager, options }) {
        var bool = message.guild.member(message.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
            message.guild.pointSystem.adminRoles.find(r => message.guild.member(message.author).roles.has(r));

        if (!bool) {
            message.channel.send('You must have permissions to use this command.');
            return;
        }

        NewWagerCommand.createWager({
            message: message,
            wager: wager,
            options: options
        });
    }
}