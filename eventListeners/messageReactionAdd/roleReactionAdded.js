const Discord = require('discord.js');

module.exports = function(client, messageReaction, user) {
    if(user === client.user) {
        return;
    }

    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    if(message.guild === undefined || message.guild === null) {
        return;
    }

    /** @type {Discord.GuildMember} */
    var member = channel.members.get(user.id);

    if(channel.id === message.guild.admin.roleChannelID) {
        var roles = message.mentions.roles;

        // Need a check for emoji's here
        roles.forEach(role => {
            member.addRole(role, 'User automatically subscribed to role.');
            member.send(`You've been added to ${role.name}.`);
        });
    }
};

