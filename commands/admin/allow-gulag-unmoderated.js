const commando = require('discord.js-commando');
const Discord = require('discord.js');

const Admin = require('../../core/Admin.js');

module.exports = class AllowGulagUnmoderatedCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'allow-gulag-unmoderated',
            group: 'admin',
            memberName: 'allow-gulag-unmoderated',
            description: 'Enables or disables the ability for players to gulag each other.',
            examples: ['!allow-gulag-unmoderated <true|false>'],
            argsPromptLimit: 0,
            aliases: ['allowgulagunmoderated'],
            guildOnly: true,
            
            args: [{
                key: 'enabled',
                prompt: "Specify whether gulags should be enabled for free usage or not. Players will be limited by their maximum energy when gulaging (see Battle).",
                type: 'boolean',
                default: ''
            }]
        });
    }

    async run(msg, { enabled }) {
        if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        /** @type {Admin} */
        var admin = msg.guild.admin;

        if (enabled === '') {
            enabled = !admin.allowGulagUnmoderated;
        }

        admin.allowGulagUnmoderated = enabled;

        if(enabled === true) {
            msg.channel.send(`Users now allowed to moderate each other (limited by their battle energy).`);
        } else {
            msg.channel.send(`Only moderators now allowed to moderate each other.`);
        }
    }
}