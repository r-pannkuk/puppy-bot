const commando = require('discord.js-commando');
const Discord = require('discord.js');

module.exports = class RandomGroupsCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'teams',
            group: 'rng',
            memberName: 'teams',
            aliases: ['group', 'team'],
            description: 'Constructs random teams of size N with the provided list of entrants.',
            examples: ['!groups 2 Dog Doggo Doggete Doglord Dogbug Dogive'],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'size',
                    prompt: 'Enter the size that each team should be.',
                    type: 'integer'
                },
                {
                    key: 'members',
                    prompt: "Please enter the items to make up the groups with.",
                    type: 'string',
                    infinite: true
                }]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args
     * @param {Number} args.size
     * @param {String[]} args.members 
     */
    async run(message, { size, members }) {
        var groups = [];
        var numGroups = Math.ceil(members.length / size);

        for (var i = 0; i < numGroups; ++i) {
            groups.push([]);
        }

        while (members.length > 0) {
            var groupIndex = Math.floor(Math.random() * numGroups);

            if (groups[groupIndex].length === size) {
                continue;
            }

            groups[groupIndex].push(members.pop());
        }

        var embed = new Discord.MessageEmbed();

        groups.forEach((group, index) => {
            embed.addField(`Group ${index + 1}:`,
                group.sort()
                    .reduce((p, c) => p + c + `\n`, ``),
                true);
        });

        message.channel.send(embed);
    }
};