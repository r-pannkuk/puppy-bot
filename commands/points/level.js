const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class LevelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'level',
            group: 'points',
            memberName: 'level',
            description: 'Current player level',
            examples: [ 'level', 'level @Dog' ],
            argsPromptLimit: 0,
            args: [
                {
                    key: 'user',
                    prompt: "Enter a username to check their level.",
                    type: 'user',
                    default: null
                }
            ]
        });
    }

    
    async run(message, { user }) {
        const settings = this.client.settings.get(message.guild.id);
        const score = this.client.points.get(user) || { points: 0, level: 0 };

        message.reply(`User ${user} `)
    }
}