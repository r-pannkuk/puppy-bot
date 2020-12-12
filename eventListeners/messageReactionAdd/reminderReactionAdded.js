const Discord = require('discord.js');
const TimeExtract = require('../../core/TimeExtract.js');

module.exports = function(client, messageReaction, user) {
    if (user === client.user) {
        return;
    }

    var message = messageReaction.message;
    var channel = message.channel;
    var emoji = messageReaction.emoji;

    var member = (channel.members && channel.members.get(user.id)) || channel.recipient;

    var reminder = client.reminders.getReminderByMessageId(message.id);

    var reminderIntervalPrompt = async(reminder, allowRealDate = true, collectCallback, rejectCallback) => {
        if (allowRealDate) {
            await channel.send("Please enter an interval or date time for reminding.");
        } else {
            await channel.send("Please enter an interval for reminding.");
        }

        var collector = new Discord.MessageCollector(
            channel,
            m => m.author.id === reminder.target || m.author.id === reminder.author, {
                time: 15000
            });

        collector.on('collect', collectCallback);
        collector.on('end', rejectCallback);
    };

    if (reminder !== undefined && reminder.isEnabled && (reminder.target === member.id || reminder.author === member.id)) {
        client.reminders.cancelReminder(reminder);

        // User cancelled
        if (emoji.name === '🚫') {
            channel.send("Reminder cancelled.");
        }
        // User repeat once
        else if (emoji.name === '🔂' || emoji.name === '🔁') {
            reminder.repeatInterval = null;
            var isHandled = false;

            var collectCallback = async(m, c) => {
                isHandled = true;
                // c.stop();

                try {
                    var input = new TimeExtract(m.content);
                } catch (e) {
                    channel.send("Sorry, that wasn't a valid input.  Please react again.");
                    return;
                }

                client.reminders.enableReminder(reminder);

                var r = reminder;

                if (emoji.name === '🔂') {
                    r = client.reminders.repeatOnce(reminder, input);

                } else if (emoji.name === '🔁') {
                    if (input.process_type === TimeExtract.Types.EXPLICIT) {
                        channel.send("You must enter a reltive time (such as \"1d\" or \"12h\") instead of an explicit time. Please react again.");
                        return;
                    }
                    if (input.interval() < 1000 * 60 * 60) {
                        channel.send("You must enter an interval that is more than one hour.  Please react again.")
                        return;
                    }

                    r = client.reminders.repeat(reminder, input);
                    channel.send(`Reminder set to repeat on an ongoing base every ${r.repeatInterval / 1000} seconds.`)
                }
                channel.send(`Next reminder set to repeat next at: ${r.reminderTime}`);
            }

            var endCallback = () => {
                if (isHandled) {
                    return;
                }

                channel.send("Timeout.  Please react again to set a repeat interval.");
                return;
            }

            // NEED TO SUPPORT A FLOW FOR REAL DATES
            reminderIntervalPrompt(reminder, false, collectCallback, endCallback);
        }
    }
};