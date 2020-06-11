const Discord = require('discord.js');
const ReminderManager = require('./ReminderManager.js');
const Reminder = require('./Reminder.js');

function discordLink(guild, channel, message) {
    var link = `https://discordapp.com/channels/${guild.id}`;
    if (channel) {
        link += `/${channel.id}`;
    }
    if (message) {
        link += `/${message.id}`;
    }

    return link;
}

module.exports.create = async function(client, reminder) {
    var target = (client.users && client.users.get(reminder.target)) || client.channels.get(reminder.target) || client.members.get(reminder.target);

    var embed = module.exports.new(client, reminder)

    if(target.type && target.guild && client.me.permissions.has('MENTION_EVERYONE')) {
        var message = await target.send("@here", {embed});
    } else {
        var message = await target.send({embed});
    }
    module.exports.addReactions({
        message: message
    });
    return message;
}

module.exports.new = function (client, reminder) {
    var author = (client.users && client.users.get(reminder.author)) || (client.members && client.members.get(reminder.author));
    var footer = `ID: ${reminder.id} | Author: ${author.displayName || author.username} | Reminded ${reminder.executionNumber} times`;

    if(reminder.isRepeat) {
        footer += ` | Repeating every ${reminder.repeatInterval/1000} seconds`;
    }
    return new Discord.RichEmbed()
        .setColor('7F00FF')
        .setTitle('Reminder!')
        // .setAuthor(client.users.get(reminder.author).username)
        .setDescription(reminder.message)
        .setFooter(footer);
} 

module.exports.addReactions = async function ({
    message,
    reactCancel = true,
    reactRepeatOnce = true,
    reactRepeat = true
}) {

    if (reactCancel) {
        await message.react('🚫');
    }

    if(reactRepeatOnce) {
        await message.react('🔂');
    }

    if(reactRepeat) {
        await message.react('🔁'); 
    }
}