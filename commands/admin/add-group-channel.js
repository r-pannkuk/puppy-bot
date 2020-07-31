const commando = require('discord.js-commando');
const Discord = require('discord.js');

const Admin = require('../../core/Admin.js');

module.exports = class AddGroupChannel extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'add-group-channel',
            group: 'admin',
            memberName: 'add-group-channel',
            description: 'Creates a new group and role for discussion.',
            examples: [
                '!add-group-channel #channel',
                '!add-group-channel #CATEGORY/channel',
                '!add-group-channel #channel @role_name'
            ],
            argsPromptLimit: 0,
            guildOnly: true,

            args: [{
                key: 'channel',
                prompt: "Store a channel for use.",
                type: 'string'
            },
            {
                key: 'role',
                prompt: 'Name for the role assigned to this channel.',
                type: 'string',
                default: ''
            }
            ]
        });
    }


    /**
     * 
     * @param {Discord.Message} msg 
     * @param {Object} args
     * @param {string} args.channel The name of the channel to add.
     * @param {string} args.role The name of the role to add.
     */
    async run(msg, { channel, role }) {
        if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        var channelInputs = channel.split('#').join('').split('@').join('').split('<').join('').split('>').join('').split('&').join('').split('/');

        if (channelInputs.length === undefined || channelInputs.length > 2) {
            msg.channel.send('Invalid channel name.  Please use an appropriate name for the group channel.');
            return;
        }

        /** @type {string} */
        var categoryName = (channelInputs.length === 2) ? channelInputs[0] : msg.channel.parent.name;
        var channelName = (channelInputs.length === 2) ? channelInputs[1] : channelInputs[0];

        if (msg.client.channels.cache.find(c => c.name === channelName && c.parent.name === categoryName)) {
            msg.channel.send(`Channel ${channel} already exists. Please use another.`);
            return;
        }

        if (role === '') {
            role = `[${channelName}]`;
        }

        var roleName = role.split('@').join('').split('<').join('').split('>').join('').split('&').join('');

        var guildRole = msg.guild.roles.cache.find(r => r.name === roleName);

        if (guildRole === null) {
            guildRole = msg.guild.roles.cache.get(roleName);
        }

        /** @type {Admin} */
        var admin = msg.guild.admin;

        if (guildRole === null || guildRole === undefined) {
            guildRole = await admin.createRole(roleName);
        }

        var overwrites = [{
            id: msg.guild.roles.everyone,
            deny: [
                'SEND_MESSAGES',
                'VIEW_CHANNEL',
                'ADD_REACTIONS',
                'SEND_TTS_MESSAGES',
                'EMBED_LINKS',
                'ATTACH_FILES',
                'READ_MESSAGE_HISTORY',
                'USE_EXTERNAL_EMOJIS'
            ]
        },
        {
            id: guildRole,
            allow: [
                'SEND_MESSAGES',
                'VIEW_CHANNEL',
                'ADD_REACTIONS',
                'SEND_TTS_MESSAGES',
                'EMBED_LINKS',
                'ATTACH_FILES',
                'READ_MESSAGE_HISTORY',
                'USE_EXTERNAL_EMOJIS'
            ]
        }
        ]

        var channel = await admin.addNewChannel(channelName, categoryName, overwrites);
        msg.channel.send(`New channel ${channel} created under ${categoryName.toUpperCase()} for ${guildRole}.`);

        if (admin.roleChannelID) {
            msg.guild.channels.cache.get(admin.roleChannelID).send(
                `${guildRole} - React with \:white_check_mark: to be added to the group and access ${channel}`
            ).then(msg => {
                msg.react("✅");
            });
        }

    }
}
