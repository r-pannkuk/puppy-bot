const commando = require('discord.js-commando');
const Discord = require('discord.js');
const moment = require('moment');


module.exports = class AddPointsRole extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'add-points-role',
            group: 'points',
            memberName: 'add-points-role',
            aliases: ['add-role', 'addrole', 'addpointsrole', 'add-points-role', 'addadminrole', 'add-admin-role'],
            description: 'Stores a role id that can be used to create wagers in the future.',
            examples: ['!add-points-role @StupidDog'],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: [Discord.Permissions.FLAGS.ADMINISTRATOR],
            args: [
                {
                    key: 'role',
                    prompt: "Store a channel for use.",
                    type: 'role'
                }
            ]
        });
    }


    async run(msg, { role }) {
        msg.guild.pointSystem.addAdminRole(role.id);

        msg.channel.send(`Role ${role} added to list of wager organizers.`);
    }


}