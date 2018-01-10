const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class DiceRollCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'roll',
            group: 'rng',
            memberName: 'roll',
            description: 'Rolls a combination of dice. Can throw up to 999 dice with 999 sides. Must throw at least one die and only dice with 2 or more sides.',
            examples: [ '!roll 3d6', '!roll 4d8', '!roll 3d6 4d8' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'input',
                    prompt: "Please enter an amount of dice and an amount of sides. Multiple groups work, e.g. 4d8 2d4",
                    type: 'string',
                    validate: input => {
                        var groups = input.split(' ');

                        if(groups.length > 25)
                            return 'Too many dice groupings.  Please use less dice.';

                        for(var group in groups) {
                            if(/^([1-9]|[1-9][0-9]|[1-9][0-9][0-9])d([1-9][0-9][0-9]|[1-9][0-9]|[2-9])$/g.test(groups[group]) == false) {
                                return 'Input had an error. Please try again.';
                            }
                        }

                        return true;
                    }
                }
            ]
        });
    }

    async run(message, args) {
        var groups = args.input.split(' ');
        var diceGroups = [];

        for(var group in groups) {
            var split = groups[group].split('d');
            var diceCount = split[0];
            var sidesCount = split[1];

            var dice = [];

            for(var i = 0; i < diceCount; ++i) {
                dice.push(Math.floor(Math.random() * sidesCount) + 1);
            }

            diceGroups.push({
                group: groups[group],
                diceCount: diceCount,
                sidesCount: sidesCount,
                dice: dice
            })
        }

        var embed = new Discord.RichEmbed()
        .setColor(14400597)
        .setAuthor(`Dice roll: ${args.input}`, 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423')

        var sum = 0;

        for(var group in diceGroups) {
            sum = diceGroups[group].dice.reduce((total, n) => total + n, sum);

            if(diceGroups[group].dice.toString().length <= 1024)
                embed.addField(diceGroups[group].group, diceGroups[group].dice.toString());
        }

        embed.setDescription(`You rolled ${sum}.`);

        return message.embed(embed);
    }
};