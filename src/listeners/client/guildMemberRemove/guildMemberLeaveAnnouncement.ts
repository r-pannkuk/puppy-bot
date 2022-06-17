import { Events, Listener } from "@sapphire/framework";
import type { Collection, GuildAuditLogsEntry, GuildMember } from "discord.js";
import {ApplyOptions} from '@sapphire/decorators'

@ApplyOptions<Listener.Options>({
    once: true,
    event: Events.GuildMemberRemove
})
export class GuildMemberRemoveLeaveAnnouncement extends Listener<typeof Events.GuildMemberRemove> {
    public async run(member: GuildMember) {
        const checkLogs =
            (entries: Collection<
                string,
                GuildAuditLogsEntry<
                    "MEMBER_BAN_ADD" | "MEMBER_KICK",
                    "MEMBER_BAN_ADD" | "MEMBER_KICK",
                    "DELETE",
                    "USER"
                >
            >) => {
                var filtered = entries.filter(entry => entry.createdTimestamp >= Date.now() - 5000)
                for (var i in filtered) {
                    const entry: GuildAuditLogsEntry<
                        "MEMBER_BAN_ADD" | "MEMBER_KICK",
                        "MEMBER_BAN_ADD" | "MEMBER_KICK",
                        "DELETE",
                        "USER"
                    > = entries[i];

                    if (entry.target?.id === member.user.id) {
                        return entry;
                    }
                }

                return null;
            }

        if (!member.user.bot) {
            var bans = await member.guild.fetchAuditLogs({
                type: "MEMBER_BAN_ADD"
            });

            var found = checkLogs(bans.entries);

            if (!found) {
                var kicks = await member.guild.fetchAuditLogs({
                    type: "MEMBER_KICK"
                });

                found = checkLogs(kicks.entries);
            }

            if (!found) {
                await member.guild.systemChannel?.send(`${member} has left the server.`);
            } else {
                if (found.action === "MEMBER_BAN_ADD") {
                    var action = "banned"
                } else if (found.action === "MEMBER_KICK") {
                    var action = "kicked"
                } else {
                    var action = "UNKNOWN";
                }
                await member.guild.systemChannel?.send(`${member} was ${action} by ${found.executor} [${found.reason}]`);
            }
        }
    }
}