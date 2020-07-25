const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');

module.exports = class UnregisterChallonge extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'unregister-challonge',
            group: 'challonge',
            memberName: 'unregister-challonge',
            aliases: ['unregister-c', 'uc', 'unregisterchallonge', 'unregisterc'],
            description: 'Disassociates a given Discord User with their challonge account.',
            examples: ['!uc @Dog#1237', '!uc'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [{
                key: 'user',
                prompt: 'Please enter the Discord User to associate with.',
                type: 'user',
                validate: (val, msg, arg) => {
                    var bool = msg.guild.member(msg.author).permissions.bitfield & 'ADMINISTRATOR' ||
                        msg.guild.pointSystem.authorizedRoles.find(r => msg.guild.member(msg.author).roles.has(r));

                    if (!bool && msg.author !== val) {
                        msg.channel.send('Only users with permissions can associate another user with Challonge.');
                        return false;
                    }

                    return true;

                },
                default: ''
            }]
        });
    }

    async run(message, { user }) {
        if (!message.guild.members.get(message.author.id).hasPermission('MANAGE_CHANNELS')) {
            message.channel.send(`You don't have permission to use that command.`);
            return;
        }

        if (user === '') {
            user = message.author;
        }

        var account = message.guild.pointSystem.getUserAccount(user, Account.SERVICE.Challonge);

        if (!account) {
            message.channel.send(`No Challonge account found for ${user}.`);
            return;
        }

        message.guild.pointSystem.removeUserAccount(user, Account.SERVICE.Challonge);

        message.channel.send(`Removed Challonge account from ${user}.`);
    }
}