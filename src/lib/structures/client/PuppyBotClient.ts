/**
 * @file PuppyBotClient.ts
 * @description Extended SapphireClient that wires up the Prisma database
 * connection and the Shoukaku/Lavalink music backend at login time.
 */
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';
import { container, SapphireClient } from '@sapphire/framework';
import { PrismaClient } from '@prisma/client';
import type { Message } from 'discord.js';
import { CLIENT_OPTIONS } from '../../setup';
import { Shoukaku, Connectors, type NodeOption } from 'shoukaku';
import { envParseBoolean, envParseInteger, envParseString } from '../../setup/utils';

export class PuppyBotClient extends SapphireClient {
    public constructor() {
        super(CLIENT_OPTIONS);
        // Initialise the in-memory music queue map; entries are populated per guild at play-time.
        this.musicQueue = new Map();
    }

    /**
     * Initialise the Shoukaku Lavalink client and attach it to `this.musicPlayer`.
     * Called during login so that `this` (the discord.js Client) is available as
     * the voice-state connector.
     */
    private _initMusic(): void {
        const lavalinkEnabled = envParseBoolean('LAVALINK_ENABLED', true);
        if (!lavalinkEnabled) return;

        const nodes: NodeOption[] = [
            {
                name: 'Main',
                url: `${envParseString('LAVALINK_HOST', 'localhost')}:${envParseInteger('LAVALINK_PORT', 2333)}`,
                auth: envParseString('LAVALINK_PASSWORD', 'youshallnotpass'),
                secure: envParseBoolean('LAVALINK_SECURE', false),
            },
        ];

        this.musicPlayer = new Shoukaku(new Connectors.DiscordJS(this), nodes, {
            moveOnDisconnect: false,
            resume: false,
            resumeTimeout: 30,
            // Allow up to 30 retries with 5s between attempts (~2.5 min total).
            // Lavalink takes ~1-3s to start, so without enough retries Shoukaku
            // gives up before Lavalink is ready when both are launched together.
            reconnectTries: 30,
            reconnectInterval: 5,
            restTimeout: 10_000,
        });

        this.musicPlayer.on('error', (name, error) => {
            container.logger.error(`[Shoukaku] Node "${name}" error:`, error);
        });

        this.musicPlayer.on('ready', (name) => {
            container.logger.info(`[Shoukaku] Node "${name}" ready.`);
        });
    }

    /**
     * Opens the Prisma database connection, initialises the music player,
     * then delegates to the Sapphire login flow.
     */
    public override async login(token?: string): Promise<string> {
        container.database = new PrismaClient();
        await container.database.$connect();
        this._initMusic();
        return super.login(token);
    }

    /**
     * Gracefully closes the Prisma database connection and the music player,
     * then calls the Sapphire / discord.js destroy.
     */
    public override async destroy(): Promise<void> {
        await container.database.$disconnect();
        // Disconnect all active Lavalink players before shutdown.
        for (const guildId of (this.musicPlayer?.players.keys() ?? [])) {
            this.musicPlayer.leaveVoiceChannel(guildId);
        }
        return super.destroy();
    }

    /**
     * Dynamic prefix resolver: looks up the guild-specific prefix from
     * the database, or falls back to the default prefix for DM channels.
     */
    public override fetchPrefix = async (message: Message): Promise<string | readonly string[]> => {
        if (isGuildBasedChannel(message.channel)) {
            const found = await container.database.guildSettings.findUnique({
                where: { guildId: message?.guild?.id },
                select: { prefix: true },
            });
            return found?.prefix ?? (this.options.defaultPrefix as string) ?? '!';
        }
        return [this.options.defaultPrefix as string, ''] as readonly string[];
    };
}
// Client and container augmentations are declared in src/lib/types/augments.d.ts

