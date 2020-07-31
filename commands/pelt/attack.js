const commando = require('discord.js-commando');
const Discord = require('discord.js');

const BattleSystem = require('../../core/battle/BattleSystem.js');
const MessageEmbedBuilder = require('../../core/battle/EmbedBuilder.js');
const TimeExtract = require('../../core/TimeExtract.js');

module.exports = class AttackCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'attack',
            group: 'pelt',
            memberName: 'attack',
            description: 'Use an item in your inventory to maul another person.',
            examples: ['!attack @Dog', '!attack @Dog "Paper Knife"'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a username to check their status.",
                    type: 'user'
                },
                {
                    key: 'item',
                    prompt: "Enter an item for use or an index.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {object} args
     * @param {Discord.User} args.user
     * @param {string} args.item
     */
    async run(message, { user, item }) {
        var attacker = message.guild.members.cache.get(message.author.id);

        if (user.id === message.client.user.id) {
            message.channel.send(`I can't let you do that, ${attacker.displayName}.`)
            return;
        }

        if (user.bot) {
            message.channel.send(`Targetting a bot seems like a low blow, don't you think?`);
            return;
        }

        /** @type {BattleSystem} */
        var battleSystem = message.guild.battleSystem;
        var attackerBattle = battleSystem.fetchUser(attacker);

        var itemsAvailable = attackerBattle.inventory.availableItems;

        if (itemsAvailable.length === 0) {
            message.channel.send(`You don't have any items ready to use. Please wait until one is ready.`);
            return;
        }

        /** Check for item present, and pick a random valid one if not. */
        if (!item) {
            var foundItem = itemsAvailable[Math.floor(Math.random() * itemsAvailable.length)];
        } else {

            var index = parseInt(item);

            var foundItem = itemsAvailable.find((val, i) =>
                val.schema.name.toLowerCase() === item.toLowerCase() || index === i
            );

            if (!foundItem) {
                message.channel.send(`${message.author}, item not found or on cooldown.  Please list one of the available items.`);
                message.channel.send(MessageEmbedBuilder.status(attacker, attackerBattle));
                return;
            }
        }

        var victim = message.guild.members.cache.get(user.id);

        var damageEvent = battleSystem.useItem(attacker, victim, foundItem);

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

        var embed = MessageEmbedBuilder.useItem(damageEvent);

        message.embed(embed);
    }
};