const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');
const RichEmbedBuilder = require('../../core/battle/RichEmbedBuilder.js');
const TimeExtract = require('../../core/TimeExtract.js');

module.exports = class PeltCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'pelt',
            group: 'pelt',
            memberName: 'pelt',
            description: 'Grabs an item at random and throws it at a player.',
            examples: ['!pelt', '!pelt @Dog'],
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
        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;
        var attacker = message.guild.members.get(message.author.id);
        var attackerBattle = battleSystem.fetch(attacker);

        var remainingDuration = battleSystem._config.peltInterval - (Date.now() - attackerBattle.lastPelt);

        if (remainingDuration > 0) {
            var durationString = TimeExtract.interval_string_milliseconds(remainingDuration);
            message.channel.send(`It's been too soon since you last pelted.\nPlease wait for **${durationString}**.`);
            return;
        }

        /* Checking if user was passed or if sent as default parameter. */
        if (Object.keys(user).length === 0) {
            var users = message.channel.members.filter(
                m => m.user.presence.status === 'online' &&
                    m.user.bot === false &&
                    m.user.id !== message.author.id
            ).array();

            if (users.size === 0) {
                message.channel.send(`Nobody was around, so you pelted yourself!`);
                user = message.author;
            } else {
                user = users[Math.floor(Math.random() * users.length)];
            }
        }

        var victim = message.guild.members.get(user.id);

        var damageEvent = battleSystem.peltUser(attacker, victim);

        /** Combining Discord and Pelt information for each user. */
        damageEvent.attacker = {
            ...damageEvent.attacker,
            ...attacker
        };
        damageEvent.victim = {
            ...damageEvent.victim,
            ...victim
        }

        damageEvent.attacker.displayName = attacker.displayName;
        damageEvent.victim.displayName = victim.displayName;

        var embed = RichEmbedBuilder.pelt(damageEvent);

        message.embed(embed);
    }
};