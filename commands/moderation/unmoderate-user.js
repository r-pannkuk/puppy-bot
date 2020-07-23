const commando = require('discord.js-commando');
const Discord = require('discord.js');
const Moderation = require('../../core/moderation/Moderation.js');
const ModerationSystem = require('../../core/moderation/ModerationSystem.js');
const TimeExtract = require('../../core/TimeExtract.js');

class UnmoderateCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'unmoderate',
            group: 'admin',
            memberName: 'unmoderate',
            description: 'Restore a user\'s priveleges if they have been moderated before.',
            examples: ['!ungulag @Dog'],
            aliases: ['ungulag', 'unmoderate-user'],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: [Discord.Permissions.FLAGS.KICK_MEMBERS],
            args: [{
                key: 'user',
                prompt: "Select the user to restore.",
                type: 'user'
            }]
        });
    }


    async run(msg, { user }) {
        /** @type {ModerationSystem} The moderation object. */
        var mods = msg.guild.moderation;
        var member = msg.guild.members.get(user.id);

        var mod = mods.getUserModerations(user);

        if (mod) {
            mods.unmoderateUser(user);

            msg.channel.send(`${user} has been unmoderated and now has restored roles.`)
        } else {
            msg.channel.send(`${user} does not have an active moderation.`);
        }
    }
}

module.exports = UnmoderateCommand;