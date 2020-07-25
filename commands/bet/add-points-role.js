const commando = require('discord.js-commando');
const Discord = require('discord.js');
const moment = require('moment');

const PointSystem = require('../../core/points/Points.js');


module.exports = class AddPointsRole extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'add-points-role',
            group: 'bet',
            memberName: 'add-points-role',
            aliases: ['add-role', 'addrole', 'addpointsrole', 'add-points-role', 'addadminrole', 'add-admin-role'],
            description: 'Stores a role id that can be used to create wagers in the future.',
            examples: ['!add-points-role @StupidDog'],
            argsPromptLimit: 0,
            guildOnly: true,
            
            args: [{
                key: 'role',
                prompt: "Store a channel for use.",
                type: 'role'
            }]
        });
    }


    async run(msg, { role }) {
        if (!msg.guild.members.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }
        
        /** @type {PointSystem} */
        var pointSystem = msg.guild.pointSystem;

        pointSystem.addAuthorizedRole(role.id);

        msg.channel.send(`Role ${role} added to list of wager organizers.`);
    }


}