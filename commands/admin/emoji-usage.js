const commando = require('discord.js-commando');
const Discord = require('discord.js');


module.exports = class EmojiUsage extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'emoji-usage',
            group: 'admin',
            memberName: 'emoji-usage',
            description: 'Calculates total emoji usage for the entire server.',
            examples: [ '!emoji-usage' ],
            argsPromptLimit: 0,
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: "User to check emoji usage for.",
                    type: 'user',
                    default: ''
                }
            ]
        });
    }

    
    async run(msg, {user}) {

        return;
        
        var channels = msg.guild.channels;
        var promises = [];
        var emojiUsage = {};
        var emojis = msg.client.emojis;
        
        
        var textChannels = channels.filter(channel => channel.type === 'text');
        
        var messages = [];

        var fetchCallback = (channel, messages, options) => {

            return channel.fetchMessages(options).then(results => {
                if(results.size === 0) {
                    console.log(`${channel.name} completed: ${messages.length} found.`);
                    return;
                }

                options.after = results.reduce((a, cv) => (cv.createdTimestamp < a.createdTimestamp) ? cv : a).id;
                messages = messages.concat(results.array());

                fetchCallback(channel, messages, options);
            });
        }

        textChannels.map(channel => {
            fetchCallback(channel, messages, {limit : 100})
        });

        // Promise.all(promises).then(() => {

        //     promises = [];
        //     console.log('Finished with message promises.');
        //     console.log(messages);
        //     var embed = new Discord.RichEmbed();
        //     embed.setTitle('Emoji Usage');

        //     for(var i in emojis) {
        //         var emoji = emojis[i];

        //         var usage = messages.filter(message => message.content.indexOf(emoji.toString())).length;

        //         embed.addField(emoji, usage);
        //     }

        //     msg.channel.send(embed);
        // });

    }

    
}