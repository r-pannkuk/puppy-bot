/**
 * @file PyScriptCommand.ts
 * @description Abstract base class for commands that generate output by running a Python script.
 *
 * Wraps `python-shell`'s `PythonShell.run()` to call a named `.py` file in
 * `src/scripts/` with optional string arguments.  Returns stdout lines as
 * `string[]` (whitespace and carriage-return trimmed).
 *
 * Concrete subclasses specify `scriptName` via `@ApplyOptions` and call
 * `this.run(args)` in their `chatInputRun` / `messageRun` handlers.
 *
 * The scripts themselves use Pillow (Python) to composite images and are invoked
 * as a child process, which means they run outside the Node.js event loop and
 * do not block the bot.
 */
import type { Command } from '@sapphire/framework';
import { PuppyBotCommand } from './PuppyBotCommand';
import { PythonShell, Options } from 'python-shell';
import { debugLog } from '../../utils/logging';

const BASE_SCRIPT_PATH = './src/scripts/';
const PYTHON_PATH = process.platform === 'win32'
    ? './.venv/Scripts/python.exe'
    : './.venv/bin/python';

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
            pythonPath: PYTHON_PATH,
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