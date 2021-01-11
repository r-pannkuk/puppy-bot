const Discord = require('discord.js');
const commando = require('discord.js-commando');

const GuildMessageCache = require('../../core/scraping/GuildMessageCache.js');

module.exports = class ScrapeMentions extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'scrape-mentions',
            group: 'admin',
            memberName: 'scrape-mentions',
            description: '.',
            examples: ['!scrape-mentions'],
            argsPromptLimit: 0,
            aliases: ['scrapementions', 'mentions'],
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

    /**
     * 
     * @param {Discord.Message} msg 
     * @param {Object} args
     * @param {Discord.User} args.user
     */
    async run(msg, { user }) {
        if (!msg.guild.members.cache.get(msg.author.id).hasPermission('ADMINISTRATOR')) {
            msg.channel.send(`You don't have permission to use that command.`);
            return;
        }

        /** @type {GuildMessageCache} */
        var guildMessageCache = msg.guild.messageCache;

        var responseMessage = await msg.channel.send(`Searching...`);

        await guildMessageCache.fetchAll(5000, (status, count) => {
            if (status.error) {
                responseMessage.edit(`ERROR: ${status.error}`);
            } else {
                responseMessage.edit(`Searching ${count} messages...`);
            }
        });

        var data = guildMessageCache.userMessageFiles;

        /** @type {Discord.TextChannel[]} */
        var emojis = msg.guild.emojis.cache.filter(e => (emoji === '') || e.id === emoji.id);

        var emojiList = {};

        emojis.forEach(e => emojiList[e.id] = 0);

        var messages = Object.values(guildMessageCache.userMessageFiles)
            .filter(v => {
                if (user) {
                    return v.user === user.id;
                }

                var member = msg.guild.members.resolve(v.user);

                if (member && member.user.bot) {
                    return false;
                }

                return true;
            })
            .map(v => Object.values(v.channelData))
            .flat()
            .map(d => d._data)
            .flat();

        for (const [key, emoji] of emojis) {
            var validMessages = messages.filter(m => m.indexOf(emoji.identifier) > -1)
            emojiList[emoji.id] += validMessages.length;
        }

        var descriptionChunks = [''];
        var descriptionChunkIterator = 0;
        var descriptionChunkLength = 2000;

        var sortedEntries = Object.entries(emojiList).sort((a, b) => b[1] - a[1]);

        for (const [id, count] of sortedEntries) {
            if(user && count === 0) {
                continue;
            }
            
            var emoji = emojis.get(id);
            var description = `${emoji} - ${count} time${count !== 1 ? `s` : ``}\n`;

            if ((descriptionChunks[descriptionChunkIterator] + description).length >= descriptionChunkLength) {
                descriptionChunkIterator += 1;
                descriptionChunks.push('');
            }

            descriptionChunks[descriptionChunkIterator] += description;
        }

        for (const chunk of descriptionChunks) {
            msg.channel.send(chunk);
        }

    }


}