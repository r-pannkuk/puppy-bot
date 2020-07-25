const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');

module.exports = class SetDescriptionCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-desc',
            group: 'pelt',
            memberName: 'set-desc',
            description: 'Sets a user\'s description.',
            examples: [ '!set-description \"A really mean dude with attitude\"', '!set-description \"A really mean dude with attitude\" @Dog' ],
            argsPromptLimit: 0,
            argsSingleQuotes: true,
            args: [
                {
                    key: 'description',
                    prompt: "Enter the description you would like to set.",
                    type: 'string',
                    max: 1024
                },
                {
                    key: 'user',
                    prompt: "Enter a username to set their status.",
                    type: 'user',
                    default: {}
                }
            ]
        });
    }

    
    async run(message, { user, description }) {
        /* Checking if user was passed or if sent as default parameter. */

        if(Object.keys(user).length === 0) {
            user = message.author;
        }

        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        var stats = battleSystem.fetch(user.id);

        stats.description = description;

        message.guild.battleSystem.set(user.id, stats);

        message.channel.send(`Updated description for ${user} to \"${description}\"`);
    }
}