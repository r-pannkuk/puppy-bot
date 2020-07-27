const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');
const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js');

module.exports = class CheckTrapCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'checktrap',
            group: 'traps',
            memberName: 'checktrap',
            description: 'Reminds the user of the trap they set.',
            guildOnly: true,
            aliases: ['!check-trap'],
            examples: ['!checktrap']
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;

        var user = battleSystem.fetchUser(message.author.id);

        var promise = message.author.createDM();

        if (user.traps.length === 0) {
            promise.then(channel => channel.send('No trap was found.'));
        } else {
            promise.then(channel => {

                for (var i in user.traps) {
                    var trap = battleSystem.getTrapByID(user.traps[i]);

                    channel.send(RichEmbedBuilder.checkTrap(trap, message));
                }
            });
        }

        message.channel.send(`Trap information was sent to ${message.author}.`);
    }
}