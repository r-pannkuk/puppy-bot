import { Listener, container, Events } from '@sapphire/framework';
import type { Client, ClientUser, Guild } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators'
import { GuildSettingsManager } from '../../../lib/structures/managers/GuildSettingsManager';
import { BattleSystem } from '../../../lib/structures/managers/BattleSystem';
import { CustomCommandSystem } from '../../../lib/structures/managers/CustomCommandSystem';
import { GuildMessageScanner } from '../../../lib/structures/managers/GuildMessageScanner';
import { EmojiUsageManager } from '../../../lib/structures/managers/EmojiUsageManager';
import { RoleAssignmentManager } from '../../../lib/structures/managers/RoleAssignmentManager';
import { MessageEchoManager } from '../../../lib/structures/managers/MessageEchoManager';
import { GuildLeaveAnnouncerManager } from '../../../lib/structures/managers/GuildLeaveAnnouncerManager';
import { debugLog } from '../../../lib/utils/logging';

@ApplyOptions<Listener.Options>({
    event: Events.GuildCreate
})
export class GuildCreateGuildInitialize extends Listener<typeof Events.GuildCreate> {
    public async run(guild: Guild) {
        await GuildCreateGuildInitialize.loadGuild(container.client, guild);
    }

    public static async loadGuild(client: Client, guild: Guild) {
        /* Admin system for server management. */
        guild.settings = new GuildSettingsManager(guild);

        await guild.settings.loadSettings();

        /* Trap management and user levels. */
        guild.battleSystem = new BattleSystem(guild);

        try {
            await guild.battleSystem.loadConfig();
            await guild.battleSystem.loadFromDB();
            await guild.battleSystem.writeToDB();
        } catch (error) {
            debugLog('error', `Error loading battle system for ${guild.name} (${guild.id})`);
        }


        /* Message scanner for stat tracking */
        guild.scanner = new GuildMessageScanner(guild);

        /* Track emoji usage and stats */
        guild.emojiUsage = new EmojiUsageManager(guild);
        try {
            await guild.emojiUsage.loadRecords();
            await guild.emojiUsage.loadRegistry();
            await guild.emojiUsage.generateLastMessageStore();
        } catch (error) {
            debugLog('error', `Error loading emoji usage for ${guild.name} (${guild.id})`);
        }

        /* Assign roles through reactions. */
        guild.roleAssigner = new RoleAssignmentManager(guild);

        try {
            await guild.roleAssigner.loadConfig();
            await guild.roleAssigner.generateMessageCollectors();
        } catch (error) {
            debugLog('error', `Error loading role assigner for ${guild.name} (${guild.id})`);
        }

        /* Message Echoer for deletions and edits */
        guild.messageEchoer = new MessageEchoManager(guild);

        try {
            await guild.messageEchoer.loadConfig();
        } catch (error) {
            debugLog('error', `Error loading message echoer for ${guild.name} (${guild.id})`);
        }

        /* Guild Leave Announcer */
        guild.leaveAnnouncer = new GuildLeaveAnnouncerManager(guild);

        try {
            await guild.leaveAnnouncer.loadConfig();
        } catch (error) {
            debugLog('error', `Error loading leave announcer for ${guild.name} (${guild.id})`);
        }

        /* Custom command system unique to each guild. */
        guild.customCommandSystem = new CustomCommandSystem(guild);

        try {
            await guild.customCommandSystem.loadFromDB();
        } catch (error) {
            debugLog('error', `Error loading custom commands for ${guild.name} (${guild.id})`);
        }

        /* SOMETIMES, IF THE LASTMESSAGEID IS NULL THIS WILL FAIL */
        try {
            await guild.members.fetch();
        } catch (error) {
            debugLog('error', `Error fetching members for ${guild.name} (${guild.id})`);
        }

        const { username, id } = client.user as ClientUser
        container.logger.info(`Successfully logged in as ${username} (${id}) in ${guild}`);
    }
}
// Guild and Client augmentations are declared in src/lib/types/augments.d.ts