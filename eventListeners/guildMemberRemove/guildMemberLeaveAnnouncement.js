const Discord = require('discord.js')

module.exports = async function (client, member) {
    if (!member.user.bot) {
        var logs = await member.guild.fetchAuditLogs({});

        var filteredLogs = logs.entries.filter(entry => {
            return (entry.createdTimestamp >= Date.now() - 5000) && (
                entry.action === 'MEMBER_BAN_ADD' ||
                entry.action === 'MEMBER_KICK'
            ) && entry.target.id === member.user.id;
        });

        if (filteredLogs.size > 0) {
            var log = filteredLogs.first();

            var action = "";
            var reason = "";

            if (log.action === 'MEMBER_BAN_ADD') {
                action = "banned";
            } else if (log.action === 'MEMBER_KICK') {
                action = "kicked";
            }

            if (log.reason !== '') {
                reason = `[${log.reason}]`;
            }

            member.guild.systemChannel.send(`${member} was ${action} by ${log.executor} ${reason}`);
        } else {
            member.guild.systemChannel.send(`${member} has left the server.`);
        }

    }
}