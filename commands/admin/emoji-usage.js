const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class EmojiUsage extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'emoji-usage',
            group: 'admin',
            memberName: 'emoji-usage',
            description: 'Calculates total emoji usage for the entire server.',
            examples: ['!emoji-usage'],
            argsPromptLimit: 0,
            guildOnly: true,
            
            args: [{
                    key: 'emoji',
                    prompt: 'An emoji to get usage statistics on.',
                    type: 'string',
                    // validate: (val, msg, arg) => {
                    //     var emojis = msg.guild.emojis;
                    //     emojis.some(e => e.name === val)
                    // },
                    default: ''
                },
                {
                    key: 'user',
                    prompt: "User to check emoji usage for.",
                    type: 'user',
                    default: ''
                }
            ]
        });
    }


    async run(msg, { emoji, user }) {
        // if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
        //     msg.channel.send(`You don't have permission to use that command.`);
        //     return;
        // }

        // var channels = msg.guild.channels.cache.filter(c => c.type === 'text').array();

        // for (let channel of channels) {
        //     await channel.messages.fetch();
        // }

        // var counts = {};

        // var channelCount = (channel) => {
        //     channel.messages.cache.forEach((m) => {
        //         if (m.content.indexOf(emoji) > -1 || m.embeds.some(f => f.indexOf(emoji) > -1)) {
        //             if (m.author.id in counts) {
        //                 counts[m.author.id]++;
        //             } else {
        //                 counts[m.author.id] = 1;
        //             }
        //         }
        //     });
        // }

        // if (!emoji) {
        //     console.log("No emoji found");
        //     var emojis = msg.guild.emojis;

        // } else {
        //     channels.forEach(channelCount);

        //     if (!user) {
        //         console.log("No user found");
        //     } else {
        //         console.log("Both found");
        //     }

        //     console.log(counts);
        // }

    }


}