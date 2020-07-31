const Discord = require('discord.js');
const commando = require('discord.js-commando');

const Points = require('../../core/points/Points.js');
const Source = require('../../core/points/Source.js');
const Account = require('../../core/points/Account.js');
const MessageEmbedBuilder = require('../../core/points/EmbedBuilder.js');

module.exports = class ListChallonge extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'list-challonge',
            group: 'challonge',
            memberName: 'list-challonge',
            aliases: ['list-c', 'lc', 'listchallonge', 'listc'],
            description: 'Lists all associated challonge accounts which have not been approved.',
            examples: ['!list-challonge'],
            argsPromptLimit: 0,
            guildOnly: true
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        if (!message.guild.members.cache.get(message.author.id).hasPermission('MANAGE_CHANNELS')) {
            message.channel.send(`You don't have permission to use that command.`);
            return;
        }

        /** @type {Points} */
        var pointSystem = message.guild.pointSystem;

        var userAccounts = pointSystem.getAllUserAccounts();
        var accountsChannelId = message.guild.admin.accountChannelID;
        /** @type {Discord.TextChannel} */
        var accountsChannel = message.guild.channels.cache.get(accountsChannelId);

        var pendingAccounts = {};

        var channels = message.guild.channels.cache.array();
        channels = channels.filter(c => c.type === 'text');

        for (var user in userAccounts) {
            for (var i in userAccounts[user]) {
                var account = userAccounts[user][i];
                var member = await message.guild.members.resolve(user);

                if (account._service !== Account.SERVICE.Challonge) {
                    continue;
                }

                if (account._status !== Account.STATUS.Pending) {
                    continue;
                }

                var confirmationMessage = undefined;

                if (accountsChannel) {
                    confirmationMessage = await accountsChannel.messages.resolve(account._confirmationMessageId);
                }

                for (var i = 0; i < channels.length && !confirmationMessage; ++i) {
                    /** @type {Discord.TextChannel} */
                    var channel = channels[i];
                    confirmationMessage = await channel.messages.resolve(account._confirmationMessageId);

                    if (confirmationMessage) {
                        break;
                    }
                }

                if (!confirmationMessage) {
                    message.channel.send(`No account confirmation message found for ${member}. Creating...`);
                    var embed = MessageEmbedBuilder.userAccount({
                        user: account,
                        serviceType: Account.SERVICE.Challonge,
                        embed: new Discord.MessageEmbed()
                            .setAuthor(member.displayName, member.user.displayAvatarURL())
                            .setColor('BLUE')
                    });

                    
                    if(accountsChannel) {
                        var channel = accountsChannel;
                    } else {
                        var channel = message.channel;
                    }
                    
                    var confirmationMessage = await channel.send(embed);
            
                    await MessageEmbedBuilder.addReactions({
                        message: confirmationMessage,
                        reactOptions: false
                    });
            
                    account._confirmationMessageId = confirmationMessage.id;
            
                    pointSystem.setUserAccount(user, account);
                }

                pendingAccounts[member.displayName] = MessageEmbedBuilder.discordLink(
                    confirmationMessage.guild,
                    confirmationMessage.channel,
                    confirmationMessage
                );
            }
        }

        if (Object.keys(pendingAccounts).length === 0) {
            message.channel.send(`No pending user accounts were found.`);
            return;
        }

        var embed = MessageEmbedBuilder.listPendingAccounts(pendingAccounts);

        message.author.send(embed);
        message.channel.send(`List of pending users sent to ${message.author}.`);
    }
}