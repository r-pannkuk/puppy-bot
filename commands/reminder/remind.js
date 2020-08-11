const commando = require('discord.js-commando');
const Discord = require('discord.js');
const pyShell = require('python-shell');
const fs = require('fs');

const Reminder = require('../../core/reminders/Reminder.js');
const TimeExtract = require('../../core/TimeExtract.js');
const MessageEmbed = require('../../core/reminders/EmbedBuilder.js');
const ReminderManager = require('../../core/reminders/ReminderManager.js');


module.exports = class RemindCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'remind',
            group: 'reminders',
            memberName: 'remind',
            description: 'Schedules a reminder for someone at or after a specific time.',
            examples: [
                '!remind 3d5h @Dog Hey stupid, you forgot to do this.',
                '!remind 01-01-2000 00:00:00 @Dog Hey idiot, happy new millenium.'
            ],
            argsPromptLimit: 0,
            args: [{
                key: 'datetime',
                prompt: 'Please enter a valid time for the reminder to be set.',
                parse: (input, msg) => {
                    var t = new TimeExtract(input);
                    var s = t.extract();
                    return s;
                },
                validate: (input, msg, arg) => {
                    return TimeExtract.validate_time_string(input);
                }
            },
            {
                key: 'target',
                prompt: 'Please enter who the reminder should be for.',
                parse: (input, msg) => {
                    // Checking for @here (message current users in channel)
                    if (input === '@here') {
                        return msg.channel;

                        // Checking for channels
                    } else if (input.indexOf('<#') === 0) {
                        var input = input.slice(input.indexOf('<') + 2, -1);

                        return msg.guild.channels.cache.get(input);

                        // Checking for users
                    } else if (input.indexOf('<@') === 0) {
                        var input = input.slice(input.indexOf('<') + 2, -1);
                        if (input[0] === '!') {
                            input = input.slice(1);
                        }

                        if(input[0] === '&') {
                            input = input.slice(1);
                            return msg.guild.roles.cache.get(input);
                        }

                        // Checks for guild then for DM
                        return (msg.client.users.cache.get(input) || msg.guild.members.cache.get(input) || msg.guild.roles.cache.get(input));
                    }

                    return null;

                },
                validate: (input, msg, arg) => {

                    // Checking for @here (message current users in channel)
                    if (input === '@here') {
                        return true;

                        // Checking for channels
                    } else if (input.indexOf('<#') === 0) {
                        var input = input.slice(input.indexOf('<') + 2, -1);

                        return msg.guild && msg.guild.channels.cache.get(input);

                        // Checking for users
                    } else if (input.indexOf('<@') === 0) {
                        var input = input.slice(input.indexOf('<') + 2, -1);
                        if (input[0] === '!') {
                            input = input.slice(1);
                        }

                        if(input[0] === '&') {
                            input = input.slice(1);
                            return msg.guild && msg.guild.roles.cache.get(input);
                        }

                        // Checks for guild then for DM
                        return (msg.guild && (
                            msg.guild.members.cache.get(input) ||
                            msg.guild.channels.cache.get(input) || 
                            msg.guild.roles.cache.get(input)
                        )) || (msg.chanel.recipieint && msg.channel.recipient.id === input);

                    }

                    return false;
                }
            },
            {
                key: 'reminderMessage',
                prompt: 'Please enter the message for reminder.',
                type: 'string'
            }

            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     * @param {Object} args 
     * @param {Date} args.datetime
     * @param {string} reminderMessage
     * 
     */
    async run(message, { datetime, target, reminderMessage }) {
        /** @type {ReminderManager} */
        var reminderManager = this.client.reminders;

        var mentions = null;

        if(target instanceof Discord.Role) {
            mentions = `${target}`;
            target = message.channel;
        } else if (target instanceof Discord.Channel) {
            mentions = '@here';
        }

        var r = reminderManager.createReminder(new Reminder({
            author: message.author.id,
            reminderTime: datetime,
            source: message.id,
            target: target.id,
            message: reminderMessage,
            mentions: mentions
        }));

        reminderManager.scheduleReminder(message.guild || this.client, r);

        var sent = await message.channel.send(`Created a new reminder for ${target} at ${datetime}: "${reminderMessage}"`);
        reminderManager.subscribeReminderMessage(r, sent);
        MessageEmbed.addReactions({
            message: sent,
            reactCancel: true,
            reactRepeat: false,
            reactRepeatOnce: false
        });
    }
}