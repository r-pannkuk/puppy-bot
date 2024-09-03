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
    // CLIENT_REGEX_PREFIX: string;
    CLIENT_OWNERS: string;
    CLIENT_ID: string;
    // CLIENT_SHARDS: string;

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

    AWBW_SCAN_INTERVAL_SECS: IntegerString;
    BATTLESYSTEM_INTERVAL_SECS: IntegerString;

    DEV_GUILD_ID: string;

    DEFAULT_TIMEZONE: 'eastern'|'pacific'|'utc';

    SOUNDCLOUD_TOKEN: string;
    YOUTUBE_TOKEN: string;
    YOUTUBE_COOKIE_FILE: string;
    CHALLONGE_TOKEN: string;
}