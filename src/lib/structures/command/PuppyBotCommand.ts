import { Command, CommandOptionsRunTypeEnum, RegisterBehavior, UserError } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Time } from "@sapphire/time-utilities";
import { Channel, CommandInteraction, ContextMenuInteraction, Guild, GuildMember, Message, MessagePayload, ReplyMessageOptions, Role, User } from "discord.js";
import { envParseArray, envParseString } from "../../env/utils";

export const SLASH_ID_HINTS: Record<string, string[]> = {
    // Admin
    add: ['987672065626742834', '987664877751517194',],
    emojiusage: ['987672066960531546', '987664878762356806',],
    set: ['987672070378901524', '987664880997896192',],
    customcommand: ['987672073075851324', '987664882050678794',],
    error: ['987664183111847986', '987664883006963722',],
    ping: ['987664272400195675', '987665053945847858',],

    // Games
    awbw: ['987672152780206110', '987664964653285386',],

    // Memes
    correct: ['987664184093319178', '987664965609607188',],
    omedetou: ['987664184907022366', '987664966146465794',],
    duwang: ['987664185599078440', '987664967249559602',],
    sylphie: ['987664186396012584', '987664968008732672',],
    kinzo: ['987664270009434112', '987664968897945670',],
    magneto: ['987664270646976524', '987664971137695794',],
    superturn: ['987664271846572062', '987664972207251466',],

    // Music
    pause: ['987672155665891348', '987664973054476398',],
    play: ['987672156789940224', '987664974279229460',],
    resume: ['987672157830148142', '987664975331991572',],
    skip: ['987672239786823700', '987665051718676480',],
    stop: ['987672240311111691', '987665052867891230',],

    // Remind
    reminder: ['987664273624936449', '987665054927294504',],

    // RNG
    roll: ['987664357322289192', '987665056760201287',],
    groups: ['987664358588969010', '987665057947209758',],

    // BattleSystem
    trap: ['987672241842049044', '987665058979020840',],
}

export const CONTEXT_MENU_ID_HINTS: Record<string, string[]> = {
    'Track Emoji Usage': ['987672068281757726', '987664879873847336',],
    'Meme - Kinzo Whining': ['987672154021703730', '987664969283817532',],
}

export abstract class PuppyBotCommand extends Subcommand {
    public readonly guarded: Boolean;
    public readonly hidden: Boolean;

    protected slashCommandOptions = {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
        guildIds: (!this.options?.runIn || this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm)) ? undefined : [envParseString("DEV_GUILD_ID")],
        idHints: (this.name in SLASH_ID_HINTS) ? SLASH_ID_HINTS[this.name] : undefined,
    }

    protected contextCommandOptions = {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
        guildIds: (this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm)) ? undefined : [envParseString('DEV_GUILD_ID')],
        idHints: (this.name in CONTEXT_MENU_ID_HINTS) ? CONTEXT_MENU_ID_HINTS[this.name] : undefined
    }

    public constructor(context: Command.Context, options: PuppyBotCommand.Options) {
        super(context, {
            cooldownDelay: 10 * Time.Second,
            cooldownLimit: 2,
            cooldownFilteredUsers: envParseArray("CLIENT_OWNERS"),
            generateDashLessAliases: true,
            ...options,
        });

        this.guarded = options.guarded ?? false;
        this.hidden = options.hidden ?? false;
    }

    protected error(identifier: string | UserError, context?: unknown): never {
        throw typeof identifier === 'string' ? new UserError({ identifier, context }) : identifier;
    }

    protected async generateFollowUp(messageOrInteraction: Message | CommandInteraction | ContextMenuInteraction):
        Promise<(options: string | MessagePayload | ReplyMessageOptions) => Promise<Message<boolean>>> {
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Generating embed...`
            })

            return async (options: string | MessagePayload | ReplyMessageOptions) => {
                const reply = await (messageOrInteraction as Message).reply(options);
                await messageOrInteraction.channel?.messages.cache.get(messageOrInteraction.id)?.delete();
                return reply;
            };
        } else {
            if (!messageOrInteraction.replied) {
                await messageOrInteraction.deferReply({
                });
            }
            return async (options: string | MessagePayload | ReplyMessageOptions) => (messageOrInteraction as CommandInteraction).editReply(options) as Promise<Message<boolean>>;
        }
    }
}

export namespace PuppyBotCommand {
    export type Options = Subcommand.Options & {
        guarded?: boolean;
        hidden?: boolean;
    }

    export type Context = Command.Context;

    export interface CommandStructure { }

    // interface testCommandStructure {
    //     'group': {
    //         'sub-command1': {
    //             'option1.1': string,
    //             'option1.2': number,
    //         },
    //         'sub-command3': {
    //             'option3.1': number,
    //             'option3.2': string,
    //         }
    //     },
    //     'sub-command2': {
    //         'option2.1': string
    //         'option2.2': number
    //     },
    //     'option3.1': boolean,
    //     'option4.1': string
    // }

    export type ParameterType = boolean | Channel | number | Role | User | GuildMember | string | undefined | null | Array<any>;

    export type ValidSubCommandGroup<T extends CommandStructure> = keyof T
    export type ValidSubCommand<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined> =
        (
            G extends ValidSubCommandGroup<T>
            ? keyof T[G]
            : {
                [s in keyof T]: T[s] extends object
                ? ({
                    [o in keyof T[s]]: T[s][o] extends ParameterType ? s : never
                }[keyof T[s]]) | (s extends {} ? s : never)
                : never
            }[keyof T]
        );
    export type ValidOption<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined> =
        (
            G extends ValidSubCommandGroup<T>
            ? (
                S extends ValidSubCommand<T, G>
                ? {
                    [k in keyof T[G]]: k extends S ? keyof T[G][k] : never
                }[keyof T[G]]
                : never
            ) : (
                S extends ValidSubCommand<T>
                ? {
                    [k in keyof T]: k extends S ? keyof T[k] : never
                }[keyof T]
                : (
                    S extends undefined
                    ? {
                        [k in keyof T]: T[k] extends ParameterType ? k : never
                    }[keyof T]
                    : never
                )
            )
        );
    export type ValidOptionType<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined, O extends ValidOption<T, G, S> | undefined = undefined> =
        G extends ValidSubCommandGroup<T> // G is a valid SubCommandGroup
        ? {
            [g in keyof T]: g extends G
            ? {
                [s in keyof T[g]]: s extends S
                ? {
                    [o in keyof T[g][s]]: o extends O ? T[g][s][o] : never
                }[keyof T[g][s]]
                : never
            }[keyof T[g]]
            : never
        }[keyof T]
        :
        S extends ValidSubCommand<T> // S is a valid SubCommand
        ? {
            [s in keyof T]: s extends S
            ? {
                [o in keyof T[s]]: o extends O ? T[s][o] : never
            }[keyof T[s]]
            : never
        }[keyof T]
        : {
            [o in keyof T]: o extends O ? T[o] : never
        }[keyof T]

    export type CommandOptions<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined> =
        {
            [o in ValidOption<T, G, S>]: ValidOptionType<T, G, S, o>
        }

    export interface Args<
        T extends PuppyBotCommand.CommandStructure,
        G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined = undefined,
        S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined = undefined,
    > {
        messageOrInteraction: Message | CommandInteraction,
        subCommandGroup?: G | null,
        subCommand?: S | null,
        guild?: Guild | null,
        user: User,
        options: PuppyBotCommand.CommandOptions<T, G, S>
    }

}