export type BooleanString = 'true' | 'false';
export type IntegerString = `${bigint}`;

export type EnvAny = keyof EnvTypes;
export type EnvString = {
    [k in EnvAny] : EnvTypes[k] extends BooleanString | IntegerString ? never : k;
}[EnvAny]
export type EnvBoolean = {
    [k in EnvAny] : EnvTypes[k] extends BooleanString ? k : never;
}[EnvAny]
export type EnvInteger = {
    [k in EnvAny] : EnvTypes[k] extends IntegerString ? k : never;
}[EnvAny]

export interface EnvTypes {
    NODE_ENV: 'test' | 'development' | 'production';
    DOTENV_DEBUG_ENABLED: BooleanString;
    LOG_DEBUG: BooleanString;
    LOG_INFO: BooleanString;
    LOG_WARN: BooleanString;

    CLIENT_NAME: string;
    CLIENT_VERSION: string;
    CLIENT_PREFIX: string;
    CLIENT_OWNERS: string;
    CLIENT_ID: string;

    CLIENT_PRESENCE_NAME: string;
    CLIENT_PRESENCE_TYPE: string;

    MONGO_URL: string;

    REDIS_PASSWORD: string;
    REDIS_PORT: IntegerString;
    REDIS_URL: string;
    REDIS_DB: IntegerString;

    SENTRY_URL: string;

    GOOGLE_ACCOUNT_EMAIL: string;
    GOOGLE_PRIVATE_KEY: string;

    BATTLESYSTEM_INTERVAL_SECS: IntegerString;

    DEV_GUILD_ID: string;

    DEFAULT_TIMEZONE: 'eastern'|'pacific'|'utc';

    SOUNDCLOUD_TOKEN: string;

    /** Lavalink node host (Shoukaku music backend). */
    LAVALINK_HOST: string;
    /** Lavalink node port. Defaults to 2333. */
    LAVALINK_PORT: IntegerString;
    /** Lavalink node authentication password. */
    LAVALINK_PASSWORD: string;
    /** Whether to connect to Lavalink over TLS. */
    LAVALINK_SECURE: BooleanString;
    /** Set to 'false' to disable the music system entirely. */
    LAVALINK_ENABLED: BooleanString;

    CHALLONGE_TOKEN: string;
}