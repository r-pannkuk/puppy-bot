const commando = require('discord.js-commando');
const Discord = require('discord.js');
const moment = require('moment');

const GameKeys = require('../GameKeys.js');


module.exports = class MHWHostChannel extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'mhw-host-channel',
            group: 'admin',
            memberName: 'mhw-host-channel',
            description: 'Stores a text channel for reporting Monster Hunter World host messages.',
            examples: [ '!mhw-host-channel #channel' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: "Store a channel for use.",
                    type: 'channel',
                    default: ''
                }
            ]
        });
    }

    
    async run(msg, { channel }) {
        if(channel !== '') {
            msg.guild.gameManager.set(GameKeys.MonsterHunterWorld, null, 'hostChannelID', channel.id);
    
            msg.channel.send(`Host channel set to ${channel}.`);
        } else {
            var channel = this.client.channels.get(msg.guild.gameManager.get(GameKeys.MonsterHunterWorld, null, 'hostChannelID'));
            msg.channel.send(`Host channel currently set to ${channel}.`);
        }
    }

    
}