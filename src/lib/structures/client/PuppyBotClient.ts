import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { container, SapphireClient } from '@sapphire/framework';
import { PrismaClient } from '@prisma/client'
import type { Message } from 'discord.js';
import { CLIENT_OPTIONS } from "../../setup";
import SoundCloudPlugin from "@distube/soundcloud";
import SpotifyPlugin from "@distube/spotify";
import { YtDlpPlugin } from "@distube/yt-dlp";
import DisTube from "distube";

export class PuppyBotClient extends SapphireClient {
    public constructor() {
        super(CLIENT_OPTIONS);
        // @ts-expect-error
        container.client = this;

        this.musicPlayer = new DisTube(this as SapphireClient, {
            emitAddListWhenCreatingQueue: true,
            emitAddSongWhenCreatingQueue: true,
            emitNewSongOnly: true,
            leaveOnStop: true,
            leaveOnEmpty: true,
            leaveOnFinish: true,
            youtubeDL: false,
            plugins: [
                new SpotifyPlugin({
                    emitEventsAfterFetching: true,
                }),
                new SoundCloudPlugin(),
                new YtDlpPlugin()
            ],
            searchSongs: 5,
            searchCooldown: 30,
        });
    }

    public override async login(token?: string) {
        container.database = new PrismaClient();
        await container.database.$connect();
        return super.login(token);
    }

    public override async destroy() {
        container.database = new PrismaClient();
        await container.database.$disconnect()
        return super.destroy;
    }

    // @ts-expect-error
    public override fetchPrefix = async (message: Message) => {
        if (isGuildBasedChannel(message.channel)) {
            return container.database.guildSettings.findUnique({
                where: {
                    guildId: message?.guild?.id
                },
                select: {
                    prefix: true
                }
            }).then((found) => found?.prefix)
        }

        return [this.options.defaultPrefix, ''] as readonly string[];
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        database: PrismaClient
    }
}

declare module 'discord.js' {
    interface Client {
        // reminders: typeof ReminderManager,
        musicPlayer: DisTube
    }
}