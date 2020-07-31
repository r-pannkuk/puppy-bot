const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');


module.exports = class TrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'trap',
            group: 'traps',
            memberName: 'trap',
            description: 'Sabotage a word or phrase to deal damage the next time a user says it in chat.',
            examples: ['!trap ', '!status @Dog'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to trap on.  The longer the trap goes unsprung, the more damage it will do.",
                    type: 'string'
                }
            ]
        });
    }


    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args 
     * @param {string} args.phrase Trap phrase
     */
    async run(message, { phrase }) {
        /** @type {BattleSystem]} */
        var battleSystem = message.guild.battleSystem;
        var result = battleSystem.addTrap({
            _messageId: message,
            _phrase: phrase,
            _owner: message.author
        });

        var attackerStats = battleSystem.fetchUser(message.author);

        var duration = battleSystem._config.traps.timeToDeleteTrapMessage;

        if (!result.error) {
            var msg = await message.channel.send(`New trap set for phrase: "${phrase}"\n` +
                `Consumed ${battleSystem._config.abilities.trap.energy} energy to create a new trap (${attackerStats.energy} remaining).\n`);

            msg.delete({timeout: duration}).catch(console.err);
            message.delete({timeout: duration}).catch(console.err);
        }
        else {
            message.channel.send(result.error);
        }
    }
}