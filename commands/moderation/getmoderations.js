const Discord = require('discord.js');
const commando = require('discord.js-commando');
const date = require('date-and-time');

const ModerationSystem = require('../../core/moderation/ModerationSystem.js');
const Moderation = require('../../core/moderation/Moderation.js');
const TimeExtract = require('../../core/TimeExtract.js');

module.exports = class GetModerationsCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'getmoderations',
            aliases: [
                'get-moderations',
                'getmoderation',
                'get-moderation',
                'get-gulaged',
                'getgulaged',
                'get-gulag',
                'getgulag',
                'get-moderated',
                'getmoderated',
                'get-gulagees',
                'getgulagees',
                'get-gulags',
                'getgulags'
            ],
            group: 'moderation',
            memberName: 'getmoderations',
            description: 'List all active moderations.',
            examples: [
                '!getmoderations'
            ],
            argsPromptLimit: 0,
            guildOnly: true,
            userPermissions: [Discord.Permissions.FLAGS.KICK_MEMBERS]
        });
    }

    /**
     * 
     * @param {Discord.Message} message 
     */
    async run(message) {
        /** @type {ModerationSystem} The moderation object. */
        var mods = message.guild.moderation;

        var guild = message.guild;

        var activeMods = Object.values(mods.moderations).filter(m => m._active);

        if (activeMods.length === 0) {
            message.channel.send(`No moderations were found.`);
            return;
        }

        var description = '';

        for (var i in activeMods) {
            /** @type {Moderation} */
            var mod = activeMods[i];
            var user = guild.members.get(mod._userId);
            var moderator = guild.members.get(mod._moderatorId);

            var duration = new TimeExtract(mod._endTime);

            description += `${user} [by ${moderator}] - ${duration.interval_string()}\n`;
        }

        var embed = new Discord.RichEmbed();

        embed.setTitle(`Moderations`);

        embed.setDescription(description);

        message.channel.send(embed);
    }
}