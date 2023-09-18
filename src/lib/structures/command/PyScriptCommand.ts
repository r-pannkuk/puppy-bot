import type { Command } from '@sapphire/framework';
import { PuppyBotCommand } from './PuppyBotCommand';
import { PythonShell, Options } from 'python-shell';
import { debugLog } from '../../utils/logging';

const BASE_SCRIPT_PATH = './src/scripts/';

export abstract class PyScriptCommand extends PuppyBotCommand {
    protected scriptDir: string = BASE_SCRIPT_PATH;
    protected scriptName: string;

    public constructor(context: PyScriptCommand.Context, options: PyScriptCommand.Options) {
        super(context, {
            ...options,
            requiredUserPermissions: ["SendMessages"],
            requiredClientPermissions: ["SendMessages"],
            nsfw: false
        })

        this.scriptName = options.scriptName;
    }

    public async run(pyArgs?: string[] | null) {
        const options = {
            mode: "text",
            pythonOptions: ['-u'],
            scriptPath: this.scriptDir,
            args: pyArgs,
        } as Options;

        return new Promise<string[]>((done, reject) =>
            PythonShell.run(
                this.scriptName, options, function (err, results) {
                    if (err) {
                        debugLog('error', err.message);
                        reject(err.message);
                        return;
                    }
                    // Trim white space and carriage return from the call
                    if (results === undefined) {
                        results = [];
                    }
                    results = results.map((value) => value.replace(/\s+/g, ''));
                    done(results);
                })
        );
    }
}

export namespace PyScriptCommand {
    export type Options = PuppyBotCommand.Options & {
        scriptName: string;
    }

    export type Context = Command.Context;
}