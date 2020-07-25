const commando = require('discord.js-commando');
const Discord = require('discord.js');

const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');

module.exports = class StatusCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'item-list',
            group: 'pelt',
            memberName: 'item-list',
            description: 'Shows what items a player has and is missing.',
            examples: [ '!item-list', '!item-list @Dog' ],
            aliases: ['itemlist', 'ilist'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a username to check their items.",
                    type: 'user',
                    default: {}
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args
     * @param {Discord.User} args.user
     */
    async run(message, { user }) {
        /* Checking if user was passed or if sent as default parameter. */

        if(Object.keys(user).length === 0) {
            user = message.author;
        }

        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;
        var member = message.guild.members.get(user.id);

        const stats = battleSystem.fetch(user.id);

        var embed = RichEmbedBuilder.itemList(member, stats, battleSystem._config.items);

        message.embed(embed);
    }
};