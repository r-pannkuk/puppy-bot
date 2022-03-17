const commando = require('discord.js-commando');
let {PythonShell} = require('python-shell');
const fs = require('fs');

const Reminder = require('../../core/reminders/Reminder.js');
const TimeExtract = require('../../core/TimeExtract.js');
const MessageEmbed = require('../../core/reminders/EmbedBuilder.js');


module.exports = class GetRemindersCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'getreminders',
            aliases: [
                'checkreminders'
            ],
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

        /** @type {Reminder[]} */
        var ownedReminders = Object.values(reminderManager.reminders)
            .filter(r => r.author === message.author.id && new Date(r.reminderTime) >= Date.now() && r.isEnabled)
            .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));

        if (ownedReminders.length > 0) {
            for (var i in ownedReminders) {
                var reminder = ownedReminders[i];
                var te = new TimeExtract(reminder.reminderTime);

                var sent = await message.author.send(
                    `**(${te.interval_date()})**: https://discordapp.com/channels/${reminder.discordGuildId}/${reminder.discordChannelId}/${reminder.discordMessageId}`
                );
            }
        } else {
            message.author.send(`You don't currently have any reminders set.`);
        }
    }
}