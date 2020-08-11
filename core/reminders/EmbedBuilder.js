const Discord = require('discord.js');
const ReminderManager = require('./ReminderManager.js');
const Reminder = require('./Reminder.js');

module.exports.create = async function(client, reminder) {
    var target = (client.users && client.users.cache.get(reminder.target)) || client.channels.cache.get(reminder.target) || client.members.cache.get(reminder.target);

    var embed = module.exports.new(client, reminder)

    var permissions = (client.me && client.me.permissions) || (target.guild && target.guild.members.cache.get(client.user.id).permissions);

    if(reminder.mentions !== undefined) {
        var message = await target.send(reminder.mentions, {embed});
    } else {
        var message = await target.send({embed});
    }
    module.exports.addReactions({
        message: message
    });
    return message;
}

module.exports.new = function (client, reminder) {
    var author = (client.users && client.users.cache.get(reminder.author)) || (client.members && client.members.cache.get(reminder.author));
    var footer = `ID: ${reminder.id} | Author: ${author.displayName || author.username} | Reminded ${reminder.executionNumber} times`;

    if(reminder.isRepeat) {
        footer += ` | Repeating every ${reminder.repeatInterval/1000} seconds`;
    }
    return new Discord.MessageEmbed()
        .setColor('7F00FF')
        .setTitle('Reminder!')
        // .setAuthor(client.users.cache.get(reminder.author).username)
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