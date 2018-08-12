module.exports = function(client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var member = channel.members.get(user.id);

    if(channel.id === message.guild.admin.getRoleChannel()) {
        var roles = message.mentions.roles;

        // Need a check for emoji's here
        roles.forEach(role => {
            member.addRole(role, 'User automatically subscribed to role.');
            member.send(`You've been added to ${role.name}.`);
        });
    }
};

