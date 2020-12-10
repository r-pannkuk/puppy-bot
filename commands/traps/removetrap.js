const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');

module.exports = class RemoveTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'removetrap',
            group: 'traps',
            memberName: 'removetrap',
            description: 'Removes the last trap set by the command sender, or attempts to remove a trap phrase.',
            examples: ['!removetrap', '!removetrap test'],
            aliases: ['disarmtrap', 'remove-trap', 'disarm-trap', 'disarm'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'phrase',
                    prompt: "Enter the phrase you want to disarm.  It will probably work.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {string} args.phrase The phrase to check for.
     */
    async run(message, { phrase }) {
        /** @type {BattleSystem]} */
        var battleSystem = message.guild.battleSystem;
        if (!phrase) {
            var traps = Object.values(battleSystem.traps);

            var trap = traps.filter(t => t.owner === message.author.id)
                .sort((a, b) => b.damage - a.damage);

            if (trap.length > 0) {
                battleSystem.removeTrap(trap.pop());

                message.channel.send('Removed your most recent trap.');
            }
            else {
                message.channel.send('You haven\'t set a trap yet.');
            }
        }
        else {
            var traps = battleSystem.traps;
            var sanitizedPhrase = phrase.toLowerCase();

            var validTraps = traps.filter(t => t.phrase.toLowerCase() === sanitizedPhrase)

            if (validTraps.length > 0) {

                validTraps.forEach(t => {
                    var trap = battleSystem.removeTrap(t);
                    var owner = message.guild.members.cache.get(trap.owner);

                    var string = `You removed ${owner}\'s trap!`;

                    if (trap.owner !== message.author.id) {

                        if(trap.damage > 0) {
                            var experience = trap.damage + battleSystem._config.traps.removeTrapExperienceBonus;
    
                            battleSystem.addExperience(message.author.id, experience);
                        }

                        string += `\n${message.author} received ${experience} XP!`;
                    }


                    message.channel.send(string);

                });
            }
            else {
                message.channel.send('Trap not found.');
            }
        }
    }
}