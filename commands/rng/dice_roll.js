const commando = require('discord.js-commando');
const Discord = require('discord.js');

const opFunctions = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b
};

/**
 * Rolls a die of a specific number of sides.
 * @param {Number} sides 
 */
function rollDie(sides) {
    return Math.ceil(Math.random() * sides);
}

/**
 * Rolls multiple dice of a specific number of sides.
 * @param {Number} dice - How many dice there are to use.
 * @param {Number} sides - How many sides are on each of the dice.
 */
function rollDice(dice, sides) {
    var results = [];

    for (let i = 0; i < dice; ++i) {
        results.push(rollDie(sides));
    }

    return results;
}

/**
 * Takes a token (such as '+2') and converts them to the write text format for writing.
 * @param {String} calculatedToken 
 */
function stringifyCalculatedToken(calculatedToken) {
    if (calculatedToken.type === 'die') {
        return `[${calculatedToken.value}]`;
    } else {
        return `${calculatedToken.value}`;
    }
}

module.exports = class DiceRollCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'roll',
            group: 'rng',
            memberName: 'roll',
            aliases: ['decision'],
            description: 'Rolls a combination of dice. Can throw up to 999 dice with 999 sides. Must throw at least one die and only dice with 2 or more sides.',
            examples: ['!roll 3d6', '!roll 4d8', '!roll 3d6 4d8'],
            argsPromptLimit: 0,
            args: [{
                key: 'input',
                prompt: "Please enter an amount of dice and an amount of sides. Multiple groups work, e.g. 4d8 2d4",
                type: 'string',
                parse: (val, msg) => {
                    const operatorRegex = /[+,\-,*,/]/g;

                    var values = val.split(operatorRegex).map(s => s.trim());
                    var operators = [...val.matchAll(operatorRegex)].flat();
                    var functions = operators.map(o => opFunctions[o]);

                    return {
                        original: val,
                        values: values,
                        operators: operators,
                        functions: functions
                    };
                },
                validate: (val, msg) => {
                    const diceRegex = /[1-9]+[0-9]*[\\s]*d[\\s]*[1-9][0-9]*([\\s]*[+,\-,*,/][\\s]*([1-9]+[0-9]*[\\s]*d[\\s]*[1-9][0-9]*|[1-9]+[0-9]*))*/g;
                    var test = diceRegex.test(val);
                    return test;
                }
            }]
        });
    }

    async run(message, { input }) {
        var originalString = input.original;
        var values = input.values;
        var operators = input.operators;
        var functions = input.functions;

        var diceResults = [];

        // TODO: PEMDAS, fuck

        var invalid = false;

        var calculated = values.map(v => {
            if (v.indexOf('d') > -1) {
                var groups = v.split('d');
                var dice = groups[0];
                var sides = groups[1];

                if (dice > 100 || sides > 1000) {
                    invalid = true;
                    return;
                }

                var results = rollDice(dice, sides);
                var total = results.reduce((sum, x) => sum + x, 0);

                diceResults.push({
                    token: v,
                    results: results,
                    total: total
                });

                return {
                    type: 'die',
                    value: total
                };
            }

            return {
                type: 'int',
                value: parseInt(v)
            };
        });

        if (invalid) {
            message.channel.send(`Please limit dice rolls to 1000 sides or 100 dice.`);
            return;
        }

        var result = calculated[0].value;
        var combinedString = stringifyCalculatedToken(calculated[0]);

        for (let i = 0; i < calculated.length - 1; ++i) {
            result = functions[i](result, calculated[i + 1].value);
            combinedString += ` ${operators[i]} ${stringifyCalculatedToken(calculated[i + 1])}`;
        }

        combinedString += ` = **${result}**`;

        var embed = new Discord.MessageEmbed()
            .setColor(14400597)
            .setAuthor(`Dice roll: ${originalString}`, 'https://vignette.wikia.nocookie.net/game-of-dice/images/c/cb/White_Dice.png/revision/latest?cb=20160113233423')

        // embed.addField(undefined, combinedString)

        for (var group in diceResults) {
            if (diceResults[group].toString().length <= 1024) {
                embed.addField(`${diceResults[group].token} = ${diceResults[group].total}`, diceResults[group].results.toString());
            } else {
                embed.addField(`${diceResults[group].token} = ${diceResults[group].total}`, diceResults[group].results.toString().slice(0, 1000) + ' ...');
            }
        }

        embed.setDescription(`${message.author} rolled ${combinedString}`);

        return message.embed(embed);
    }
};