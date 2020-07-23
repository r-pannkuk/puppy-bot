const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Moderation = require('../../core/moderation/Moderation.js');
const ModerationSystem = require('../../core/moderation/ModerationSystem.js');
const TimeExtract = require('../../core/TimeExtract.js');

class ModerateCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'moderate',
            group: 'admin',
            memberName: 'moderate',
            description: 'Temporarily suspends a user\'s priveleges and puts them in a designated moderation channel.',
            examples: ['!gulag @Dog'],
            aliases: ['gulag', 'moderate-user'],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: [Discord.Permissions.FLAGS.KICK_MEMBERS],
            args: [{
                    key: 'user',
                    prompt: "Select the user for moderation.",
                    type: 'user',
                    error: 'Please enter a valid user.'
                },
                {
                    key: 'duration',
                    prompt: "(Optional) Enter for how long the user should be gulaged for.",
                    type: 'string',
                    parse: (input, msg) => {
                        var t = new TimeExtract(input);
                        var s = t.extract();
                        return s;
                    },
                    validate: (input, msg, arg) => {
                        if (input === '') {
                            return true;
                        }

                        return TimeExtract.validate_time_string(input) || 'Please enter a valid duration or omit one.';
                    },
                    default: ''
                }
            ]
        });
    }


    /**
     * 
     * @param {Discord.Message} msg - Discord message.
     * @param {Object} args -  Arguments Container
     * @param {Discord.User} args.user - User for moderation
     * @param {string} args.date - Date string for moderating.
     */
    async run(msg, { user, duration }) {
        if (duration === '') {
            duration = 'Dec 31 23:59:59 2099 UTC';
        }

        if (user === this.client.user) {
            msg.channel.send(`This bot is too powerful to be moderated.`);
            return;
        }

        /** @type {ModerationSystem} The moderation object. */
        var mods = msg.guild.moderation;
        var member = msg.guild.members.get(user.id);

        var activeMod = mods.getUserModerations(member);

        var roles = member.roles.map(r => r.id).filter(r => r !== null && r != msg.guild.admin.moderationRoleID);

        var mod = mods.moderateUser({
            _moderatorId: msg.author.id,
            _roles: roles,
            _endTime: duration,
            _userId: user.id
        });

        if (activeMod) {
            msg.channel.send(`${user}'s moderated status was extended until ${duration}`)
        } else {
            msg.channel.send(`${user} was moderated until ${duration}.`)
        }
    }
}

module.exports = ModerateCommand;