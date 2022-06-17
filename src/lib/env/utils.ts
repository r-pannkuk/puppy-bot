import { isNullishOrEmpty } from "@sapphire/utilities";
import type { EnvTypes, EnvAny, EnvBoolean, EnvInteger, EnvString } from "./types";

export function envParseInteger(key: EnvInteger, defaultValue? : number) : number {
    const value = process.env[key];
    if(isNullishOrEmpty(value)) {
        if(!defaultValue) throw new Error(`[ENV] ${key} - Key must be an integer, but is empty or undefined.`);
        return defaultValue;
    }

    const integer = Number(value);
    if(Number.isInteger(integer)) return integer;
    throw new Error(`[ENV] ${key} - Key must be an integer, but received \`${value}\`.`);
}

export function envParseBoolean(key: EnvBoolean, defaultValue? : boolean) : boolean {
    const value = process.env[key];
    if(isNullishOrEmpty(value)) {
        if(!defaultValue) throw new Error(`[ENV] ${key} - Key must be a boolean, but is empty or undefined.`);
        return defaultValue;
    }

    if(value === 'true') return true;
    if(value === 'false') return false;
    throw new Error(`[ENV] ${key} - Key must be a boolean, but received \`${value}\`.`);
}

export function envParseString(key: EnvString, defaultValue? : EnvTypes[EnvString]) : EnvTypes[EnvString] {
    const value = process.env[key];
    if(isNullishOrEmpty(value)) {
        if(!defaultValue) throw new Error(`[ENV] ${key} - Key must be a string, but is empty or undefined.`);
        return defaultValue;
    }

    return value;
}

export function envParseArray(key : EnvString, defaultValue? : string[]) : string[] {
    const value = process.env[key];
    if(isNullishOrEmpty(value)) {
        if(!defaultValue) throw new Error(`[ENV] ${key} - Key must be an array, but is empty or undefined.`);
        return defaultValue;
    }

    return value.split(' ');
}

export function envIsDefined(...keys: readonly EnvAny[]) : boolean {
    return keys.every((key) => !isNullishOrEmpty(process.env[key]));
}