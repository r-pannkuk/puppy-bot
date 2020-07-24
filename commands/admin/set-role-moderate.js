const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class SetRoleModeration extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'set-role-moderation',
            group: 'admin',
            memberName: 'set-role-moderation',
            description: 'Admin tool for setting a role for user moderation.',
            examples: ['!set-role-moderation <role>'],
            argsPromptLimit: 0,
            aliases: ['set-role-gulag', 'set-role-moderate'],
            guildOnly: true,
            
            args: [{
                key: 'role',
                prompt: "Enter a role name which will be designated for user moderation.",
                type: 'role',
                default: ''
            }]
        });
    }

    async run(msg, { role }) {
        if (!msg.guild.members.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        if (role !== '') {
            msg.guild.admin.moderationRoleID = role.id;

            msg.channel.send(`Moderation role set successfully.  Users will be assigned ${role} upon use of the !moderate/!gulag command.`);
        } else {
            var role = msg.guild.roles.get(msg.guild.admin.moderationRoleID);
            msg.channel.send(`Moderation role currently set to ${role}.`);
        }

    }
}