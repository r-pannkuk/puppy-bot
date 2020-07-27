const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');
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

    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args
     * @param {Discord.User} args.user
     */
    async run(message, { user }) {
        /* Checking if user was passed or if sent as default parameter. */

        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        if(Object.keys(user).length === 0) {
            user = message.author;
        }

        var member = message.guild.members.get(user.id);

        const stats = battleSystem.fetchUser(user.id);

        var embed = RichEmbedBuilder.status(member, stats);

        message.embed(embed);
    }
};