const commando = require('discord.js-commando');
const pyShell = require('python-shell');
const fs = require('fs');

const Reminder = require('../../core/reminders/Reminder.js');
const TimeExtract = require('../../core/reminders/TimeExtract.js');
const RichEmbed = require('../../core/reminders/RichEmbedBuilder.js');


module.exports = class GetRemindersCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'getreminders',
            group: 'reminders',
            memberName: 'getreminders',
            description: 'Lists all reminders that you own.',
            examples: [
                '!getreminders.'
            ],
            argsPromptLimit: 0
        });
    }

    async run(message) {
        var reminderManager = this.client.reminders;

        var ownedReminders = Object.values(reminderManager.reminders)
            .filter(r => r.author === message.author.id && new Date(r.reminderTime) >= Date.now() && r.isEnabled)
            .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));

        var channels = message.guild.channels.array();

        if (ownedReminders.length > 0) {
            for (var i in ownedReminders) {
                var reminder = ownedReminders[i];
                var reminderDate = new Date(reminder.reminderTime);

                var deltaSeconds = (reminderDate - Date.now()) / 1000;

                var days = Math.floor(deltaSeconds / 86400);
                deltaSeconds -= days * 86400;

                var hours = Math.floor(deltaSeconds / 3600) % 24;
                deltaSeconds -= hours * 3600;

                var minutes = Math.floor(deltaSeconds / 60) % 60;
                deltaSeconds -= minutes * 60;

                deltaSeconds = Math.floor(deltaSeconds);

                var datestring = [];

                if (days) { datestring.push(`${days} days`) }
                if (hours) { datestring.push(`${hours} hours`) }
                if (minutes) { datestring.push(`${minutes} minutes`) }
                if (deltaSeconds) { datestring.push(`${deltaSeconds} seconds`) }

                datestring = datestring.join(', ');

                var foundChannel;
                var foundMessage;

                for (var i in channels) {
                    var c = channels[i];

                    if (c.type !== 'text') {
                        continue;
                    }

                    try {
                        foundChannel = c;
                        foundMessage = await c.fetchMessage(reminder.discordMessageId);
                        break;
                    } catch (error) {
                        continue;
                    }
                };

                if(!foundMessage) {
                    var sent = await message.author.send(`**(${datestring})**: *Unknown.*`);
                } else {
                    var sent = await message.author.send(`**(${datestring})**: ${RichEmbed.discordLink(message.guild, foundChannel, foundMessage)}`);
                }
            }
        } else {
            message.author.send(`You don't currently have any reminders set.`);
        }
    }
}
