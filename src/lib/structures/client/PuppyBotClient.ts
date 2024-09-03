import { isGuildBasedChannel } from "@sapphire/discord.js-utilities";
import { container, SapphireClient } from '@sapphire/framework';
import { PrismaClient } from '@prisma/client'
import type { Message } from 'discord.js';
import { CLIENT_OPTIONS } from "../../setup";
import DisTube from "distube";
import { YouTubePlugin } from '@distube/youtube';
import { SoundCloudPlugin } from "@distube/soundcloud";
import SpotifyPlugin from "@distube/spotify";
import { envParseString } from "../../env/utils";
import fs from 'fs';
import ytdl from "@distube/ytdl-core";

export class PuppyBotClient extends SapphireClient {
    public constructor() {
        super(CLIENT_OPTIONS);
        // @ts-expect-error
        container.client = this;

        const cookies = envParseString('YOUTUBE_COOKIE_FILE', "") !== "" ?
            JSON.parse(fs.readFileSync(envParseString('YOUTUBE_COOKIE_FILE'), 'utf-8')) :
            undefined;


        const agent = ytdl.createAgent(cookies);

        this.musicPlayer = new DisTube(this as SapphireClient, {
            emitAddListWhenCreatingQueue: true,
            emitAddSongWhenCreatingQueue: true,
            emitNewSongOnly: true,
            plugins: [
                new YouTubePlugin({
                    ytdlOptions: {
                        agent,
                    },
                    cookies
                }),
                new SoundCloudPlugin(),
                new SpotifyPlugin(),
            ],
            customFilters: {
                'bassboost': 'bass=g=10',
                '8D': 'apulsator=hz=0.08',
                'vaporwave': 'aresample=48000,asetrate=48000*0.8',
                'nightcore': 'aresample=48000,asetrate=48000*1.25',
                'phaser': 'aphaser=in_gain=0.4',
                'tremolo': 'tremolo',
                'vibrato': 'vibrato=f=6.5',
                'reverse': 'areverse',
                'treble': 'treble=g=5',
                'normalizer': 'dynaudnorm=g=101',
                'surrounding': 'surround',
                'pulsator': 'apulsator=hz=1',
                'subboost': 'asubboost',
                'karaoke': 'stereotools=mlev=0.03',
                'flanger': 'flanger',
                'gate': 'agate',
                'haas': 'haas',
                'mcompand': 'mcompand',
                'earwax': 'earwax',
            },
            joinNewVoiceChannel: true,
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
        return super.destroy();
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