const commando = require('discord.js-commando');
const Discord = require('discord.js');

const Moderation = require('../../core/moderation/Moderation.js');
const ModerationSystem = require('../../core/moderation/ModerationSystem.js');
const TimeExtract = require('../../core/TimeExtract.js');
const Admin = require('../../core/Admin.js');
const BattleSystem = require('../../core/battle/BattleSystem.js');

class ModerateCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'moderate',
            group: 'admin',
            memberName: 'moderate',
            description: 'Temporarily suspends a user\'s priveleges and puts them in a designated moderation channel.',
            examples: ['!gulag @Dog'],
            aliases: ['gulag', 'moderate-user', 'moderateuser'],
            argsPromptLimit: 0,
            guildOnly: true,
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

    static moderateUser(msg, user, duration) {
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

        var endTime = new Date(mod._endTime);
        var endTimeString = `${endTime.toDateString()} ${endTime.toTimeString()}`;

        if (activeMod) {
            msg.channel.send(`${member}'s moderated status was extended until ${endTimeString}.`);
        } else {
            msg.channel.send(`${member} was moderated until ${endTimeString}.`)
        }

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

        /** @type {Admin} */
        var admin = msg.guild.admin;

        var member = msg.guild.members.get(msg.author.id);

        if (member.hasPermission('KICK_MEMBERS')) {
            ModerateCommand.moderateUser(msg, user, duration);
            return;
        } else if(admin.allowGulagUnmoderated) {
            /** @type {BattleSystem} */
            var battleSystem = msg.guild.battleSystem;
    
            var attackerStats = battleSystem.fetchUser(member);

            var amount = new Date(duration) - Date.now();

            var response = battleSystem.useAbility(attackerStats, `gulag`, amount, (userObj, energy) => {                
                msg.channel.send(`Consumed ${Math.ceil(energy)} of ${member.displayName}'s energy (${userObj.energy} remaining).`);
                return ModerateCommand.moderateUser(msg, user, duration);
            });

            if(response && response.error) {
                msg.channel.send(response.error);
                return;
            }
        } else {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }
    }
}

module.exports = ModerateCommand;