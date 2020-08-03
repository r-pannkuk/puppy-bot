const Discord = require('discord.js');
const commando = require('discord.js-commando');


module.exports = class EmojiUsage extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'emoji-usage',
            group: 'admin',
            memberName: 'emoji-usage',
            description: 'Calculates total emoji usage for the entire server.',
            examples: ['!emoji-usage'],
            argsPromptLimit: 0,
            aliases: ['emojiusage', 'emoji-count', 'emojicount', 'count-emoji', 'countemoji'],
            guildOnly: true,

            args: [
                {
                    key: 'user',
                    prompt: "User to check emoji usage for.",
                    type: 'user',
                    default: ''
                },
                {
                    key: 'emoji',
                    prompt: 'An emoji to get usage statistics on.',
                    type: 'custom-emoji',
                    default: ''
                }

            ]
        });
    }

    /**
     * 
     * @param {Discord.Message} msg 
     * @param {Object} args
     * @param {Discord.User} args.user
     * @param {Discord.Emoji} args.emoji
     */
    async run(msg, { user, emoji }) {
        if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        var responseMessage = await msg.channel.send(`Searching...`);

        /** @type {Discord.TextChannel[]} */
        var channels = msg.guild.channels.cache.filter(c => c.type === 'text');
        var emojis = msg.guild.emojis.cache.filter(e => (emoji === '') || e.id === emoji.id);

        var emojiList = {};

        emojis.forEach(e => emojiList[e.id] = 0);

        var messageCount = 0;
        var lastMessageCount = 0;

        var interval = setInterval(() => {
            responseMessage.edit(`Searched ${messageCount} messages...`);

            if(messageCount === lastMessageCount) {
                clearInterval(interval);
            }
            
            lastMessageCount = messageCount;
        }, 5000);

        for (const [key, channel] of channels) {
            var firstMessageID = null;

            var limit = 100;

            do {
                var messages = await channel.messages.fetch({
                    limit: limit,
                    before: firstMessageID
                });

                for(const [key, emoji] of emojis) {
                    var validMessages = messages.filter(m => m.content.indexOf(emoji.identifier) > -1)
                    emojiList[emoji.id] += validMessages.size;
                }

                var sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                messageCount += messages.size;

                if(sorted.size !== limit) {
                    break;
                } else {
                    firstMessageID = messages.first().id;
                }

            } while (true)
        }

        var descriptionChunks = [''];
        var descriptionChunkIterator = 0;
        var descriptionChunkLength = 2000;

        var sortedEntries = Object.entries(emojiList).sort((a, b) => b[1] - a[1]);

        for(const [id, count] of sortedEntries) {
            var emoji = emojis.get(id);
            var description = `${emoji} - ${count} time${count !== 1 ? `s` : ``}\n`;

            if((descriptionChunks[descriptionChunkIterator] + description).length >= descriptionChunkLength) {
                descriptionChunkIterator += 1;
                descriptionChunks.push('');
            }

            descriptionChunks[descriptionChunkIterator] += description;
        }

        responseMessage.edit(`Searched ${messageCount} messages.`);

        msg.channel.send(`${msg.author}, emoji-usage command finished (${messageCount} messages searched):`);

        for(const chunk of descriptionChunks) {
            msg.channel.send(chunk);
        }

    }


}