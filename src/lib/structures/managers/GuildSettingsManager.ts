import type { GuildSettings, PrismaClient } from "@prisma/client";
import type { CategoryChannel, GuildChannelCreateOptions, GuildTextBasedChannel, OverwriteResolvable, Role } from "discord.js";
import { container, Resolvers } from "@sapphire/framework";
import { ChannelType, Guild } from "discord.js";
import type { IGuildManager } from "./IGuildManager";

export class GuildSettingsManager implements GuildSettings, IGuildManager {
    public guildId: string;
    public get guild() {
        return container.client.guilds.cache.get(this.guildId);
    }
    private cache!: GuildSettings;

    private get settings() {
        return this.cache;
    }

    get prefix() { return this.settings.prefix; }
    get timezone() { return this.settings.timezone; };
    get accountChannelId() { return this.settings.accountChannelId; }
    get accountChannel() {
        return this.accountChannelId ? Resolvers.resolveGuildTextChannel(this.accountChannelId, this.guild!).unwrap() : null
    }

    public constructor(guild: Guild) {
        this.guildId = guild.id;

        // (async () => {
        //     await this.loadSettings();
        // })();
    }

    public async loadSettings() {
        var loadedSettings = await container.database.guildSettings.findUnique({
            where: {
                guildId: this.guildId
            }
        });


        if (!loadedSettings) {
            var defaultPrefix = container.client.options.defaultPrefix!;
            if (typeof defaultPrefix[Symbol.iterator] === 'function') {
                defaultPrefix = defaultPrefix[0];
            }
            loadedSettings = await container.database.guildSettings.create({
                data: {
                    guildId: this.guildId,
                    prefix: defaultPrefix?.toString()
                }
            })
        }
        this.cache = loadedSettings;
    }

    public async set(settings: Partial<GuildSettings>) {
        let { guildId, ...payload } = settings;
        const updatedSettings = await container.database.guildSettings.update({
            where: {
                guildId: this.guildId
            },
            data: payload
        })

        this.cache = updatedSettings;
    }

    /**
     * 
     * @callback NewChannelCallback
     * @param {Discord.Channel} channel
     */

    /**
     * Creates a new channel under the specified category.
     * @param {string} channelName 
     * @param {string} categoryName 
     * @param {boolean} overwrites 
     * @param {NewChannelCallback} callback
     */
    public async createChannel(channelName: string | null, categoryName: string | null, overwrites?: OverwriteResolvable[]) {
        let categoryChannel: CategoryChannel | null = null;
        let channel: GuildTextBasedChannel | null = null;

        if (categoryName) {
            var categoryResolver = await Resolvers.resolveGuildCategoryChannel(categoryName, this.guild!)
            if ('error' in categoryResolver) {
                categoryChannel = await this.guild!.channels.create({
                    name: categoryName,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: overwrites
                } as GuildChannelCreateOptions) as unknown as CategoryChannel;
            } else {
                categoryChannel = categoryResolver.unwrap();
            }
        } else {
            categoryName;
        }

        if (channelName) {
            var channelResolver = await Resolvers.resolveGuildTextChannel(channelName, this.guild!);
            if ('error' in channelResolver) {
                channel = await this.guild!.channels.create({
                    name: channelName,
                    parent: categoryChannel?.id,
                    permissionOverwrites: overwrites
                } as GuildChannelCreateOptions) as GuildTextBasedChannel;
            } else {
                channel = channelResolver.unwrap()
            }
        }

        return channel;
    }

    /**
     * Creates a new role with the specified
     * @param {string} roleName 
     * @param {Function.<Discord.Role>} callback 
     */
    public async createRole(roleName) {
        var role: Role | null = null;

        /* Role Validator */
        if (roleName) {
            var roleResolver = await Resolvers.resolveRole(roleName, this.guild!);
            if ('error' in roleResolver) {
                role = await this.guild!.roles.create({
                    name: roleName,
                    color: 'Default',
                    permissions: 'ManageRoles',
                    mentionable: true,
                })
            } else {
                role = roleResolver.unwrap();
            }
        }

        return role;
    }
}

declare module '@sapphire/pieces' {
    interface Container {
        database: PrismaClient
    }
}