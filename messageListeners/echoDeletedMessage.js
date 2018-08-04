const Discord = require('discord.js');
const moment = require('moment');

module.exports = function(message, client) {
    if(message.channel.type !== 'text') {
        return;
    }

    var echoChannel = message.client.channels.get(client.admin.getDeleteChannel());

    if(message.content.indexOf("!trap") !== 0) {
        var createdDate = new Date(message.createdTimestamp);
        var m = moment.tz(createdDate, 'America/New_York');
        var content = `(${m.format('YYYY-MM-DD h:mm:ss a')}) Deleted message from **${message.author.username}** [${message.channel}]:\n${message.content}`;
        var attachment = message.attachments.first();
        
        if(attachment !== undefined) {
            var newAttachment = new Discord.Attachment(attachment.proxyURL, attachment.filename);
            echoChannel.send(content, newAttachment)
            .catch((error) => {
                console.error(error);
                echoChannel.send(`ERROR: Unable to fetch attachment at: ${attachment.proxyURL}`);
            });
        } else if(message.embeds.length > 0) {
            echoChannel.send(content, new Discord.RichEmbed(message.embeds[0]));
        } else {
            console.log(echoChannel);
            echoChannel.send(content);
        }
        
    }
};