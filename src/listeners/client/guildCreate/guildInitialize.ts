import { Listener, container, Events } from '@sapphire/framework';
import type { Client, ClientUser, Guild } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators'
import { GuildSettingsManager } from '../../../lib/structures/managers/GuildSettingsManager';
import { BattleSystem } from '../../../lib/structures/managers/BattleSystem';
import { CustomCommandSystem } from '../../../lib/structures/managers/CustomCommandSystem';
import { AWBWScanner } from '../../../lib/structures/managers/games/AWBWScanner';
import { GuildMessageScanner } from '../../../lib/structures/managers/GuildMessageScanner';
import { EmojiUsageManager } from '../../../lib/structures/managers/EmojiUsageManager';
import { RoleAssignmentManager } from '../../../lib/structures/managers/RoleAssignmentManager';
import { MessageEchoManager } from '../../../lib/structures/managers/MessageEchoManager';
import { debugLog } from '../../../lib/utils/logging';

@ApplyOptions<Listener.Options>({
    once: true,
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

        await guild.battleSystem.loadConfig();
        await guild.battleSystem.loadFromDB();
        await guild.battleSystem.writeToDB();

        // Games Trackers
        guild.games = {

            /* Advance Wars By Web */
            awbw: new AWBWScanner(guild),

        };

        await guild.games.awbw.loadConfig();
        await guild.games.awbw.loadRegistry();

        /* Message scanner for stat tracking */
        guild.scanner = new GuildMessageScanner(guild);

        /* Instantiated Message Scanners */
        {
            /* Track emoji usage and stats */
            guild.emojiUsage = new EmojiUsageManager(guild);

            /* Assign roles through reactions. */
            guild.roleAssigner = new RoleAssignmentManager(guild);
        }

        await guild.roleAssigner.loadConfig();
        await guild.roleAssigner.generateMessageCollectors();

        /* Message Echoer for deletions and edits */
        guild.messageEchoer = new MessageEchoManager(guild);

        await guild.messageEchoer.loadConfig();

        // /* Betting system for awarding users. */
        // guild.pointSystem = new PointSystem(guild.settings);

        // /* Challonge manager added to bot. */
        // guild.challonge = new Challonge(guild.settings, {
        //     apiKey: process.env.CHALLONGE
        // });

        // /* Moderation system for managing user activity. */
        // guild.moderation = new ModerationSystem(guild.settings);
        // guild.moderation.scheduleAllModerations();

        /* Custom command system unique to each guild. */
        guild.customCommandSystem = new CustomCommandSystem(guild);

        await guild.customCommandSystem.loadFromDB();

        // /* Guild message cache for tracking user stats and simulations. */
        // guild.messageCache = new GuildMessageCache(guild.settings);
        // guild.messageCache.init();

        // /* Notepad for user notes. */
        // guild.notepad = new Notepad(guild.settings);

        // /* Game manager for managing game keys and settings. */
        // guild.gameManager = new GameManager(guild.settings);

        /* AWBW tracker and poller. */
        // let AdvanceWarsByWeb = (await import('../../core/games/AdvanceWarsByWeb.mjs')).default;
        // guild.AWBW = new AdvanceWarsByWeb(guild.settings);

        /* SOMETIMES, IF THE LASTMESSAGEID IS NULL THIS WILL FAIL */
        await guild.emojiUsage.loadRecords();
        await guild.emojiUsage.loadRegistry();
        await guild.emojiUsage.generateLastMessageStore();

        await guild.members.fetch();

        const { username, id } = client.user as ClientUser
        debugLog('info', `Successfully logged in as ${username} (${id}) in ${guild}`);
    }
}

declare module 'discord.js' {
    export interface Guild {
        settings: GuildSettingsManager,
        battleSystem: BattleSystem,
        customCommandSystem: CustomCommandSystem,
        games: {
            awbw: AWBWScanner,
        },
        scanner: GuildMessageScanner,
        messageEchoer: MessageEchoManager,
        emojiUsage: EmojiUsageManager,
        roleAssigner: RoleAssignmentManager
    }
}