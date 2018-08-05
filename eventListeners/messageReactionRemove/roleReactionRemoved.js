module.exports = function(client, messageReaction, user) {
    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var member = channel.members.get(user.id);

    if(channel.id === client.admin.getRoleChannel()) {
        var roles = message.mentions.roles;

        // Need a check for emoji's here
        roles.forEach(role => {
            member.removeRole(role, 'User unsubscribed to role.');
        });
    }
};

