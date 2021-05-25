const Discord = require('discord.js');
const commando = require('discord.js-commando');

const CustomManager = require('../../core/custom/CustomManager.js');

module.exports = class CommandListCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'command-list',
            group: 'custom',
            memberName: 'command-list',
            description: 'Lists all available custom commands.',
            examples: ['!command-list'],
            aliases: ['memelist', 'meme-list', 'commandlist', 'custom-command-list', 'custom-commandlist', 'customcommand-list', 'customcommandlist'],
            argsPromptLimit: 0
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {CustomManager} */
        var customManager = message.guild.customManager;

        if (Object.keys(customManager.commands).length === 0) {
            message.channel.send(`No custom commands found.`);
            return;
        }

        var commandSchemas = Object.values(customManager.commands).sort((a, b) => a.name - b.name)

        while(commandSchemas.length > 0)
        {
            var embed = new Discord.MessageEmbed()
                .setAuthor(`Custom Commands`);

            var description = "";

            while(commandSchemas.length > 0) {
                var command = commandSchemas[0];
                var member = message.guild.members.resolve(command._owner);
                var text = `\`${command._name}\` [${member}]` +
                ` - Used ${command._useCount} time${(command._useCount === 1) ? `` : `s`}` +
                `${(command._useCount > 0) ? `, last on ${new Date(command._lastUsedDate).toDateString()}` : ``}.\n`

                if(description.length + text.length > 2048) {
                    if(description.length === 0) {
                        message.channel.send(`Something went wrong.  Please contact ${this.client.owners}.`);
                        return;
                    }
                    break;
                }

                description += text;

                commandSchemas = commandSchemas.splice(1);
            }

            embed.setDescription(description);

            await message.channel.send(embed);
        }
    }
}
