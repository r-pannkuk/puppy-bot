const Discord = require('discord.js');
const commando = require('discord.js-commando');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');
const RichEmbedBuilder = require('../../core/points/RichEmbedBuilder.js');

module.exports = class RegisterChallonge extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'register-challonge',
            group: 'challonge',
            memberName: 'register-challonge',
            aliases: ['register-c', 'rc', 'registerchallonge', 'registerc'],
            description: 'Associates a given Discord User with their challonge account.',
            examples: ['!register Klypto @Dog#1347', '!register Klypto'],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'challongeId',
                    prompt: 'Please enter your challonge ID or email.',
                    type: 'string'
                },
                {
                    key: 'user',
                    prompt: 'Please enter the Discord User to associate with.',
                    type: 'user',
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

        if (challongeAccount && challongeAccount._status !== Account.STATUS.Pending) {
            message.channel.send(`User ${user} already has a Challonge account for ${challongeAccount._username || challongeAccount._email}.`)
            return;
        }

        var account = new Account({
            _service: Account.SERVICE.Challonge
        });

        account._username = challongeId;

        var userObj = message.guild.pointSystem.getUserByAccount(account);

        if (userObj) {
            var discordUser = message.guild.members.get(userObj._id);
            message.channel.send(`Found user ${discordUser} who has the Challonge account for **${challongeId}**.`);
            return;
        }

        userObj = message.guild.pointSystem.setUserAccount(user, account);

        var embed = RichEmbedBuilder.userAccount({
            user: userObj,
            serviceType: Account.SERVICE.Challonge,
            embed: new Discord.RichEmbed()
                .setAuthor(user.username, user.avatarURL)
                .setColor('BLUE')
        });

        var accountChannel = message.guild.channels.get(message.guild.admin.accountChannelID);
        
        if(!accountChannel) {
            accountChannel = message.channel;
        }
        
        var message = await accountChannel.send(embed);

        await RichEmbedBuilder.addReactions({
            message: message,
            reactOptions: false
        });

        account._confirmationMessageId = message.id;

        message.guild.pointSystem.setUserAccount(user, account);
    }
}