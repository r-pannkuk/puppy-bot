const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');

module.exports = class AccountChallonge extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'account-challonge',
            group: 'points',
            memberName: 'account-challonge',
            aliases: ['account-c', 'ac', 'accountchallonge', 'accountc'],
            description: 'Fetches a challonge account for a given Discord User.',
            examples: ['!ac @Dog#1347', '!ac'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: 'Please enter the Discord User to associate with.',
                    type: 'user',
                    validate: (val, msg, arg) => {
                        var bool = msg.guild.member(msg.author).permissions.bitfield & Discord.Permissions.FLAGS.ADMINISTRATOR ||
                            msg.guild.pointSystem.adminRoles.find(r => msg.guild.member(message.author).roles.has(r));

                        if (!bool && msg.author !== val) {
                            msg.channel.send('Only users with permissions can associate another user with Challonge.');
                            return false;
                        }

                        return true;
                    },
                    default: ''
                }
            ]
        });
    }

    async run(message, { challongeId, user }) {
        if (user === '') {
            user = message.author;
        }

        var challongeAccount = message.guild.pointSystem.getUserAccount(user, Account.SERVICE.Challonge);

        if (!challongeAccount) {
            message.channel.send(`User ${user} does not have a Challonge account stored.`)
            return;
        }
        var username = (challongeAccount._username) ? challongeAccount._username : '';

        // Fix with Rich Embed later
        message.channel.send(`Found Challonge account for ${user} under: **${username}**.`);
    }
}