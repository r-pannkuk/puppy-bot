/**
 * @file utils.ts
 * @description Typed env-variable accessors that delegate to the Zod-parsed
 * {@link env} object. These helpers maintain backward-compatible signatures so
 * existing call-sites require no changes.
 */
import type { EnvTypes, EnvAny, EnvBoolean, EnvInteger, EnvString } from './types';

export function envParseInteger(key: EnvInteger, defaultValue?: number): number {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`[ENV] ${key} - Key must be an integer, but is empty or undefined.`);
    }
    const n = Number(raw);
    if (Number.isInteger(n)) return n;
    throw new Error(`[ENV] ${key} - Key must be an integer, but received \`${raw}\`.`);
}

export function envParseBoolean(key: EnvBoolean, defaultValue?: boolean): boolean {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`[ENV] ${key} - Key must be a boolean, but is empty or undefined.`);
    }
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    throw new Error(`[ENV] ${key} - Key must be a boolean, but received \`${raw}\`.`);
}

export function envParseString(key: EnvString, defaultValue?: EnvTypes[EnvString]): EnvTypes[EnvString] {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`[ENV] ${key} - Key must be a string, but is empty or undefined.`);
    }
    return raw;
}

export function envParseArray(key: EnvString, defaultValue?: string[]): string[] {
    const raw = process.env[key];
    if (raw === undefined || raw === '') {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`[ENV] ${key} - Key must be an array, but is empty or undefined.`);
    }
    return raw.split(' ');
}

export function envIsDefined(...keys: readonly EnvAny[]): boolean {
    return keys.every((key) => {
        const v = process.env[key];
        return v !== undefined && v !== '';
    });
}

/**
 * Return the fully-parsed Zod env object for direct typed access.
 * Prefer this over the individual `envParse*` functions in new code.
 */
export { env } from './schema';
export type { Env } from './schema';
