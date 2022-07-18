import type { Command } from '@sapphire/framework';
import { PuppyBotCommand } from './PuppyBotCommand';
import { PythonShell, Options, PythonShellError } from 'python-shell';
import { debugLog } from '../../utils/logging';

const BASE_SCRIPT_PATH = './src/scripts/';

export abstract class PyScriptCommand extends PuppyBotCommand {
    protected scriptDir: string = BASE_SCRIPT_PATH;
    protected scriptName: string;

    public constructor(context: PyScriptCommand.Context, options: PyScriptCommand.Options) {
        super(context, {
            ...options,
            requiredUserPermissions: ['SEND_MESSAGES'],
            requiredClientPermissions: ['SEND_MESSAGES'],
            nsfw: false
        })

        this.scriptName = options.scriptName;
    }

    public async run(pyArgs?: string[] | null) {
        const options = {
            mode: "text",
            pythonOptions: ['-u'],
            scriptPath: this.scriptDir,
            args: pyArgs
        } as Options;

        try {
            const result = new Promise<string[]>((done, reject) =>
                PythonShell.run(
                    this.scriptName, options, function (err, results) {
                        if (err) {
                            debugLog('error', err.message);
                            reject(err);
                        }
                        // Trim white space and carriage return from the call
                        if (results === undefined) {
                            results = [];
                        }
                        results = results.map((value) => value.replace(/\s+/g, ''));
                        done(results);
                    })
            );

            return result;
        } catch (e) {
            if(e instanceof PythonShellError) {
                this.error(e.message);
            } else throw e;
        }
    }
}

export namespace PyScriptCommand {
    export type Options = PuppyBotCommand.Options & {
        scriptName: string;
    }

    export type Context = Command.Context;
}