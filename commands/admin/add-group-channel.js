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
        if (!msg.guild.members.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        if (msg.client.channels.exists('name', channel)) {
            msg.channel.send(`Channel ${channel} already exists. Please use another.`);
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

        if (role === '') {
            role = `[${channelName}]`;
        }

        var roleName = role.split('@').join('').split('<').join('').split('>').join('').split('&').join('');

        var guildRole = msg.guild.roles.find('name', roleName);

        if (guildRole === null) {
            guildRole = msg.guild.roles.get(roleName);
        }

        /** @type {Admin} */
        var admin = msg.guild.admin;

        /**
         * @param {Discord.Role} role 
         */
        var createChannelCallback = (role) => {
            var overwrites = [{
                    id: msg.guild.defaultRole,
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
                    id: role,
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

            admin.addNewChannel(msg.guild, channelName, categoryName, overwrites, (channel) => {
                msg.channel.send(`New channel ${channel} created under ${categoryName.toUpperCase()} for ${role}.`);

                if(admin.roleChannelID) {
                    msg.guild.channels.get(admin.roleChannelID).send(
                        `${role} - React with \:white_check_mark: to be added to the group and access ${channel}`
                    ).then(msg => {
                        msg.react("✅");
                    });
                }
            });
        };

        if (guildRole === null || guildRole === undefined) {
            admin.createRole(msg.guild, roleName, createChannelCallback);
        } else {
            createChannelCallback(guildRole);
        }
    }


}